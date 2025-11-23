import { createRouter, createWebHistory } from 'vue-router';
import StartPage from '../views/StartPage.vue';
import GamePage from '../views/GamePage.vue';
import { useGameStore } from '../stores/gameStore';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'start',
      component: StartPage
    },
    {
      path: '/game',
      name: 'game',
      component: GamePage,
      beforeEnter: (_, __, next) => {
        const store = useGameStore();
        if (store.players.length === 0) {
          next('/');
        } else {
          next();
        }
      }
    }
  ]
});

export default router;
