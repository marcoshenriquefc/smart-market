import IListItem from '@/interfaces/IListItem';
import {
  IRemoteItemMutationResponse,
  ISyncOperation,
  ISyncSessionConfig,
  SyncOperationType,
  SyncStatus,
} from '@/interfaces/ISync';
import { apiClient } from '@/services/apiClient';
import { OfflineStorage } from '@/services/offlineStorage';
import { generateUUID } from '@/utils/uuid';

const VALID_SYNC_TYPES: SyncOperationType[] = [
  'ADD_ITEM',
  'UPDATE_ITEM',
  'DELETE_ITEM',
];

type StatusListener = (state: {
  isOnline: boolean;
  status: SyncStatus;
  pendingCount: number;
  serverTotal?: number;
}) => void;

interface SyncRegistrationLike extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

class SyncManager {
  private queue: ISyncOperation[] = [];
  private isFlushing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private status: SyncStatus = this.isOnline ? 'synced' : 'offline';
  private listeners: StatusListener[] = [];
  private retryTimerId: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const loaded = await OfflineStorage.loadQueue();
    this.queue = loaded.filter(
      (op) => VALID_SYNC_TYPES.includes(op.type) && Boolean(op.itemId)
    );
    if (this.queue.length !== loaded.length) {
      await OfflineStorage.saveQueue(this.queue);
    }

    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.recomputeStatus();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          void this.flushQueue();
        }
      });
    }

    if (this.isOnline && this.queue.length > 0) {
      void this.flushQueue();
    }
  }

  subscribe(listener: StatusListener): () => void {
    this.listeners.push(listener);
    listener({
      isOnline: this.isOnline,
      status: this.status,
      pendingCount: this.queue.length,
    });
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    };
  }

  configureSession(config: ISyncSessionConfig): void {
    apiClient.setSession(config);
    if (this.isOnline) {
      void this.flushQueue();
    }
  }

  private hasRemoteSession(): boolean {
    return apiClient.hasAuthenticatedSession();
  }

  /**
   * Enfileira apenas 1 mutação por item (o servidor recalcula o total atomicamente).
   */
  async enqueue(
    type: SyncOperationType,
    options: { item: IListItem }
  ): Promise<void> {
    if (!this.isOnline || this.hasRemoteSession()) {
      this.coalesceIntoQueue(type, options.item);
      await OfflineStorage.saveQueue(this.queue);
      this.registerBackgroundSync();
    }

    this.recomputeStatus();

    if (this.isOnline && this.queue.length > 0) {
      void this.flushQueue();
    }
  }

  private coalesceIntoQueue(type: SyncOperationType, rawItem: IListItem): void {
    const now = Date.now();
    const item = { ...rawItem };
    const itemId = item.id;
    if (!itemId) return;

    const pendingAddIdx = this.queue.findIndex(
      (op) => op.type === 'ADD_ITEM' && op.itemId === itemId
    );

    if (type === 'ADD_ITEM') {
      this.queue = this.queue.filter((op) => op.itemId !== itemId);
      this.queue.push({
        id: generateUUID(),
        type: 'ADD_ITEM',
        itemId,
        itemSnapshot: item,
        createdAt: now,
        retries: 0,
      });
      return;
    }

    if (type === 'UPDATE_ITEM') {
      if (pendingAddIdx !== -1) {
        this.queue[pendingAddIdx].itemSnapshot = item;
        return;
      }

      this.queue = this.queue.filter(
        (op) => !(op.type === 'UPDATE_ITEM' && op.itemId === itemId)
      );
      this.queue.push({
        id: generateUUID(),
        type: 'UPDATE_ITEM',
        itemId,
        itemSnapshot: item,
        createdAt: now,
        retries: 0,
      });
      return;
    }

    if (type === 'DELETE_ITEM') {
      if (pendingAddIdx !== -1) {
        this.queue = this.queue.filter((op) => op.itemId !== itemId);
        return;
      }

      this.queue = this.queue.filter((op) => op.itemId !== itemId);
      this.queue.push({
        id: generateUUID(),
        type: 'DELETE_ITEM',
        itemId,
        itemSnapshot: item,
        createdAt: now,
        retries: 0,
      });
    }
  }

  async flushQueue(): Promise<void> {
    if (this.isFlushing || !this.isOnline) return;
    if (this.queue.length === 0) {
      this.recomputeStatus();
      return;
    }

    this.isFlushing = true;
    this.status = 'syncing';
    this.notify();

    if (this.retryTimerId) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }

    try {
      if (!this.hasRemoteSession()) {
        this.queue = [];
        await OfflineStorage.saveQueue(this.queue);
        this.isFlushing = false;
        this.recomputeStatus();
        return;
      }

      const listId = await this.ensureRemoteListId();
      if (!listId) {
        throw new Error('REMOTE_LIST_UNAVAILABLE');
      }

      let latestServerTotal: number | undefined;

      while (this.queue.length > 0 && this.isOnline) {
        const currentOp = this.queue[0];
        const responseData = await this.executeRemoteOperation(listId, currentOp);
        if (responseData && typeof responseData.total === 'number') {
          latestServerTotal = responseData.total;
        }
        this.queue.shift();
        await OfflineStorage.saveQueue(this.queue);
        this.notify(this.queue.length === 0 ? latestServerTotal : undefined);
      }

      this.isFlushing = false;
      this.recomputeStatus(latestServerTotal);
    } catch {
      this.isFlushing = false;
      if (this.queue.length > 0) {
        this.queue[0].retries += 1;
        await OfflineStorage.saveQueue(this.queue);
      }
      this.status = this.isOnline ? 'error' : 'offline';
      this.notify();
      this.scheduleRetry();
    }
  }

  private async ensureRemoteListId(): Promise<string | null> {
    const session = apiClient.getSession();
    if (session.listId) {
      return session.listId;
    }

    const now = new Date();
    const response = await apiClient.authenticatedFetch('/listProduct', {
      method: 'POST',
      body: JSON.stringify({
        year_created: now.getFullYear(),
        mounth_created: now.getMonth() + 1,
        itens_list: [],
        total: 0,
        saved_list: false,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const created = (await response.json()) as { _id?: string };
    if (created && created._id) {
      apiClient.setSession({ listId: created._id });
      return created._id;
    }
    return null;
  }

  private async executeRemoteOperation(
    listId: string,
    op: ISyncOperation
  ): Promise<IRemoteItemMutationResponse | null> {
    if (op.type === 'ADD_ITEM' && op.itemSnapshot) {
      const res = await apiClient.authenticatedFetch('/listProduct/item', {
        method: 'POST',
        body: JSON.stringify({
          list_id: listId,
          id_item: op.itemSnapshot.id,
          quantity: op.itemSnapshot.quantity,
          name: op.itemSnapshot.name,
          price: op.itemSnapshot.price,
          total: op.itemSnapshot.total,
          checked: op.itemSnapshot.checked,
        }),
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      return (await res.json()) as IRemoteItemMutationResponse;
    }

    if (op.type === 'UPDATE_ITEM' && op.itemSnapshot) {
      const res = await apiClient.authenticatedFetch('/listProduct/updateItem', {
        method: 'PUT',
        body: JSON.stringify({
          list_id: listId,
          itemUpdate: {
            id_item: op.itemSnapshot.id,
            quantity: op.itemSnapshot.quantity,
            name: op.itemSnapshot.name,
            price: op.itemSnapshot.price,
            total: op.itemSnapshot.total,
            checked: op.itemSnapshot.checked,
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      return (await res.json()) as IRemoteItemMutationResponse;
    }

    if (op.type === 'DELETE_ITEM' && op.itemId) {
      const res = await apiClient.authenticatedFetch('/listProduct/removeItem', {
        method: 'PUT',
        body: JSON.stringify({
          list_id: listId,
          id_item: op.itemId,
        }),
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP_${res.status}`);
      return res.ok ? ((await res.json()) as IRemoteItemMutationResponse) : null;
    }

    return null;
  }

  private scheduleRetry(): void {
    if (this.retryTimerId || !this.isOnline || this.queue.length === 0) return;
    const retries = this.queue[0]?.retries || 1;
    const delayMs = Math.min(30000, 2000 * Math.pow(2, Math.min(retries, 4)));

    this.retryTimerId = setTimeout(() => {
      this.retryTimerId = null;
      if (this.isOnline) {
        void this.flushQueue();
      }
    }, delayMs);
  }

  private registerBackgroundSync(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => {
        const syncReg = reg as SyncRegistrationLike;
        if (syncReg.sync) {
          return syncReg.sync.register('smart-market-sync');
        }
        return undefined;
      })
      .catch(() => undefined);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.recomputeStatus();
    void this.flushQueue();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    if (this.retryTimerId) {
      clearTimeout(this.retryTimerId);
      this.retryTimerId = null;
    }
    this.recomputeStatus();
  };

  private recomputeStatus(serverTotal?: number): void {
    if (!this.isOnline) {
      this.status = 'offline';
    } else if (this.isFlushing) {
      this.status = 'syncing';
    } else if (this.queue.length > 0) {
      this.status = 'pending';
    } else {
      this.status = 'synced';
    }
    this.notify(serverTotal);
  }

  private notify(serverTotal?: number): void {
    const snapshot = {
      isOnline: this.isOnline,
      status: this.status,
      pendingCount: this.queue.length,
      serverTotal,
    };
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const syncManager = new SyncManager();
