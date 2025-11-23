import { tilesToString } from "../utils/format";
import type { Tile } from "../utils/define";

// 读取环境变量 (Vite 默认只暴露 VITE_ 开头的变量)
const API_URL = import.meta.env.VITE_API_URL || "https://api.openai.com/v1/chat/completions";
const API_KEY = import.meta.env.VITE_API_KEY || "";
const MODEL_NAME = import.meta.env.VITE_LLM_MODEL || "gpt-3.5-turbo";

export interface AIResponse {
    discard: string; // 例如 "1m"
    reason: string;  // 例如 "理由..."
}

/**
 * 尝试清理 AI 返回的字符串，移除可能的 Markdown 标记
 * 例如: ```json { ... } ``` -> { ... }
 */
function cleanJsonString(str: string): string {
    return str.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function getAIDecision(
    hand: Tile[],
    melds: any[],
    discards: Tile[],
    opponentDiscards: Tile[]
): Promise<AIResponse> {

    // 1. 安全检查：如果没有配置 Key，直接报错抛出，让外层 catch 处理
    if (!API_KEY) {
        throw new Error("Missing VITE_API_KEY in environment variables");
    }

    const handStr = tilesToString(hand);
    const meldStr = melds.length > 0 ? `已副露: ${JSON.stringify(melds)}` : "无副露";

    // 2. 构造 Prompt (微调：强调简短和JSON)
    const systemPrompt = `
你正在玩四川麻将（血战到底）。
当前规则：缺一门（缺筒或条），不可吃，只能碰杠。
请扮演一位经验丰富的老牌友，根据手牌决策打出一张牌。

要求：
1. 分析手牌结构，优先打出缺门牌或孤张。
2. 必须只返回纯净的 JSON 字符串，严禁 Markdown 格式。
3. 格式：{"discard": "牌代码(如1m)", "reason": "20字以内的吐槽"}
`;

    const userPrompt = `
我的手牌: [${handStr}]
${meldStr}
场况: 还没听牌,
对方出牌: [${tilesToString(opponentDiscards)}],
我的弃牌: [${tilesToString(discards)}],
请决策。
`;

    // 3. 创建 AbortController 用于超时控制 (防止 AI 卡死游戏)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0.7,
                // 注意：response_format: { type: "json_object" } 只有较新的 OpenAI 模型支持
                // 如果用 DeepSeek 或旧模型，可以注释掉这行，靠 prompt 约束即可
                // response_format: { type: "json_object" } 
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId); // 请求成功，清除定时器

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "{}";

        // 清洗数据，防止 JSON.parse 挂掉
        content = cleanJsonString(content);

        const result = JSON.parse(content);

        // 简单的校验，确保 AI 没有胡言乱语
        if (!result.discard || !result.reason) {
            throw new Error("Invalid JSON format from AI");
        }

        return result as AIResponse;

    } catch (error: any) {
        clearTimeout(timeoutId); // 确保清除定时器
        console.error("AI Decision Failed:", error.name === 'AbortError' ? 'Timeout' : error.message);

        // 抛出错误，让 store 里的 try-catch 去处理兜底逻辑 (随机打牌)
        throw error;
    }
}