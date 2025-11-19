<template>
  <div class="start-page">
    <div class="background-animation">
      <div class="tile-float" v-for="i in 20" :key="i" :style="getFloatStyle()">
        {{ getRandomTile() }}
      </div>
    </div>

    <div class="start-container">
      <div class="game-logo">
        <div class="logo-icon">🀄</div>
        <h1 class="game-title">血战川麻馆</h1>
        <h2 class="game-subtitle">双人麻将</h2>
      </div>

      <div class="start-content">

        <div class="start-actions">
          <button @click="startGame" class="btn-start">
            <span class="btn-text">开始游戏</span>
            <span class="btn-icon">▶</span>
          </button>
        </div>
      </div>

      <div class="start-footer">
        <p class="version-info">Version 1.0.0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/gameStore';

const router = useRouter();
const gameStore = useGameStore();

const tiles = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏',
  '🀙', '🀚', '🀛', '🀜', '🀝', '🀞', '🀟', '🀠', '🀡',
  '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘',
  '🀀', '🀁', '🀂', '🀃', '🀄', '🀅', '🀆'];

const getRandomTile = () => {
  return tiles[Math.floor(Math.random() * tiles.length)];
};

const getFloatStyle = () => {
  const left = Math.random() * 100;
  const animationDelay = Math.random() * 5;
  const animationDuration = 10 + Math.random() * 10;
  const fontSize = 30 + Math.random() * 40;

  return {
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${animationDuration}s`,
    fontSize: `${fontSize}px`,
    opacity: 0.1 + Math.random() * 0.2
  };
};

const startGame = () => {
  gameStore.startNewGame();
  router.push('/game');
};
</script>

<style scoped>
.start-page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%);
  overflow: hidden;
}

/* 背景动画 */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.tile-float {
  position: absolute;
  top: -100px;
  animation: float-down linear infinite;
  filter: blur(1px);
}

@keyframes float-down {
  0% {
    transform: translateY(-100px) rotate(0deg);
  }

  100% {
    transform: translateY(100vh) rotate(360deg);
  }
}

/* 主容器 */
.start-container {
  position: relative;
  z-index: 1;
  max-width: 600px;
  width: 90%;
  padding: 60px 40px;
  background: linear-gradient(135deg, rgba(26, 35, 50, 0.95) 0%, rgba(15, 20, 25, 0.95) 100%);
  border-radius: 30px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 215, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  text-align: center;
}

/* Logo区域 */
.game-logo {
  margin-bottom: 50px;
}

.logo-icon {
  font-size: 120px;
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.5));
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

.game-title {
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
  text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
}

.game-subtitle {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 300;
  letter-spacing: 4px;
}

/* 内容区域 */
.start-content {
  margin-bottom: 40px;
}

.game-description {
  margin-bottom: 40px;
}

.game-description p {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin: 10px 0;
  line-height: 1.6;
}

/* 开始按钮 */
.start-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.btn-start {
  position: relative;
  padding: 20px 60px;
  font-size: 24px;
  font-weight: 600;
  color: #1a2332;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow:
    0 10px 30px rgba(255, 215, 0, 0.4),
    0 0 0 2px rgba(255, 215, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 15px;
  overflow: hidden;
}

.btn-start::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.btn-start:hover::before {
  left: 100%;
}

.btn-start:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow:
    0 15px 40px rgba(255, 215, 0, 0.6),
    0 0 0 3px rgba(255, 215, 0, 0.3);
}

.btn-start:active {
  transform: translateY(-1px) scale(1.02);
}

.btn-text {
  position: relative;
  z-index: 1;
}

.btn-icon {
  position: relative;
  z-index: 1;
  font-size: 20px;
  transition: transform 0.3s ease;
}

.btn-start:hover .btn-icon {
  transform: translateX(5px);
}

/* 特性列表 */
.game-features {
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  border: 1px solid rgba(255, 215, 0, 0.1);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
  transform: translateY(-3px);
}

.feature-icon {
  font-size: 32px;
  filter: drop-shadow(0 2px 5px rgba(255, 215, 0, 0.3));
}

.feature-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* 页脚 */
.start-footer {
  margin-top: 40px;
  padding-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.version-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .start-container {
    padding: 40px 30px;
  }

  .logo-icon {
    font-size: 80px;
  }

  .game-title {
    font-size: 36px;
  }

  .game-subtitle {
    font-size: 18px;
  }

  .btn-start {
    padding: 16px 40px;
    font-size: 20px;
  }

  .game-features {
    gap: 15px;
  }

  .feature-item {
    padding: 12px 16px;
  }
}
</style>
