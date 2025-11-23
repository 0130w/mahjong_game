import { tilesToString } from "../utils/format";
import type { Tile } from "../utils/define";

// 1. 读取环境变量
// 注意：Vite 项目中，环境变量必须以 VITE_ 开头才能在代码中通过 import.meta.env 访问
// 请确保你的 .env 文件里写的是 VITE_API_URL 和 VITE_API_KEY
const API_URL = import.meta.env.VITE_API_URL || "https://api.deepseek.com/chat/completions";
const API_KEY = import.meta.env.VITE_API_KEY || "";
// 2. 修改默认模型名称为 deepseek-chat
const MODEL_NAME = import.meta.env.VITE_LLM_MODEL || "deepseek-chat";

export interface AIResponse {
    discard: string;
    reason: string;
}

// 清洗 DeepSeek 可能返回的 Markdown 格式
function cleanJsonString(str: string): string {
    return str.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function getAIDecision(
    hand: Tile[],
    melds: any[],
    discards: Tile[],
    opponentDiscards: Tile[]
): Promise<AIResponse> {

    if (!API_KEY) {
        throw new Error("Missing VITE_API_KEY");
    }

    const handStr = tilesToString(hand);
    const meldStr = melds.length > 0 ? `已副露: ${JSON.stringify(melds)}` : "无副露";

    // System Prompt: DeepSeek 听从指令的能力很强，这里强调只返回 JSON
    const systemPrompt = `
你正在玩四川麻将（血战到底）。
规则：缺一门（通常缺筒或条），不可吃，只能碰杠。
请作为一名高手，分析当前局势并打出一张牌。

关键要求：
1. 必须只返回纯净的 JSON 字符串。
2. 不要使用 Markdown 代码块（不要用 \`\`\`json）。
3. JSON格式：{"discard": "牌代码(如1m)", "reason": "20字以内的吐槽"}
`;

    const userPrompt = `
我的手牌: [${handStr}]
${meldStr}
对方的弃牌: [${tilesToString(opponentDiscards)}]，
我的弃牌: [${tilesToString(discards)}]，
请决策。
`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODEL_NAME, // 确保这里是 deepseek-chat
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 1.0, // DeepSeek 推荐 V3 模型使用 1.0 或 1.3 以获得更灵活的回答，0.7 也可以
                stream: false,    // 显式关闭流式传输
                // 【重要修改】移除了 response_format 参数，防止兼容性报错
                // response_format: { type: "json_object" } 
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`DeepSeek API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "{}";

        // DeepSeek 有时很礼貌，喜欢加 Markdown 框，所以 cleanJsonString 很重要
        content = cleanJsonString(content);

        const result = JSON.parse(content);

        if (!result.discard || !result.reason) {
            throw new Error("Invalid JSON structure");
        }

        return result as AIResponse;

    } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
    }
}