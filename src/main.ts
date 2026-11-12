import { createApp } from 'vue';
import App from './App.vue';
import { store, key } from './store';
import { registerPwaServiceWorker } from './pwa/registerServiceWorker';

registerPwaServiceWorker();
void store.dispatch('initOfflineEngine');

createApp(App)
  .use(store, key)
  .mount('#app');
