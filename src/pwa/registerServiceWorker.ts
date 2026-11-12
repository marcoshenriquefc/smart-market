import { ref } from 'vue';
import { syncManager } from '@/services/syncManager';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const deferredInstallPrompt = ref<BeforeInstallPromptEvent | null>(null);
export const canInstallPwa = ref(false);

export async function promptPwaInstall(): Promise<void> {
  const promptEvent = deferredInstallPrompt.value;
  if (!promptEvent) return;

  await promptEvent.prompt();
  await promptEvent.userChoice;
  deferredInstallPrompt.value = null;
  canInstallPwa.value = false;
}

export function registerPwaServiceWorker(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault();
    deferredInstallPrompt.value = event as BeforeInstallPromptEvent;
    canInstallPwa.value = true;
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt.value = null;
    canInstallPwa.value = false;
  });

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (event.data && event.data.type === 'FLUSH_SYNC_QUEUE') {
      void syncManager.flushQueue();
    }
  });

  window.addEventListener('load', () => {
    const swUrl = `${process.env.BASE_URL || '/'}sw.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      })
      .catch(() => undefined);
  });
}
