import IListItem from '@/interfaces/IListItem';
import { IOfflineSnapshot, ISyncOperation } from '@/interfaces/ISync';
import { generateUUID } from '@/utils/uuid';

const DB_NAME = 'smart-market-db';
const DB_VERSION = 1;
const STATE_STORE = 'app_state';
const QUEUE_STORE = 'sync_queue';
const CURRENT_LIST_KEY = 'current_list';

const LS_ITEMS_KEY = 'smart_market_items_v1';
const LS_QUEUE_FALLBACK_KEY = 'smart_market_sync_queue_v1';
const LEGACY_COOKIE_NAME = 'Itens';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STATE_STORE)) {
          db.createObjectStore(STATE_STORE);
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

function normalizeItems(rawItems: IListItem[]): IListItem[] {
  return rawItems.map((raw) => {
    const quantity = Number(raw.quantity) > 0 ? Number(raw.quantity) : 1;
    const price = Number(raw.price) >= 0 ? Number(raw.price) : 0;
    return {
      id: raw.id || generateUUID(),
      name: String(raw.name || 'Produto'),
      quantity,
      price,
      total: Number.isFinite(Number(raw.total)) ? Number(raw.total) : quantity * price,
      checked: Boolean(raw.checked),
    };
  });
}

function safeReadLocalStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWriteLocalStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Caso a quota de ~5 MB do localStorage estoure, o IndexedDB continua salvando normalmente
  }
}

/**
 * Migra dados legados caso existam em cookie de versões antigas e apaga o cookie imediatamente
 * para que nunca mais trafegue nos headers HTTP nem sofra truncamento de 4 KB.
 */
function migrateAndPurgeLegacyCookie(): IListItem[] {
  if (typeof document === 'undefined' || !document.cookie) {
    return [];
  }

  const prefix = `${LEGACY_COOKIE_NAME}=`;
  const entries = decodeURIComponent(document.cookie).split(';');
  let rawLegacyJson = '';

  for (const rawEntry of entries) {
    const trimmed = rawEntry.trim();
    if (trimmed.indexOf(prefix) === 0) {
      rawLegacyJson = trimmed.substring(prefix.length);
      break;
    }
  }

  // Expira o cookie legado tanto no path atual quanto na raiz
  document.cookie = `${LEGACY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${LEGACY_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

  if (!rawLegacyJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawLegacyJson) as IListItem[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const migrated = normalizeItems(parsed);
      void OfflineStorage.saveListSnapshot(migrated);
      return migrated;
    }
  } catch {
    // Cookie antigo corrompido ou truncado: já foi limpo acima
  }

  return [];
}

export class OfflineStorage {
  /**
   * Hidratação síncrona instantânea (0 ms) via localStorage (~5 MB),
   * migrando e removendo qualquer cookie legado caso presente.
   */
  static loadInstantSnapshot(): IListItem[] {
    const lsSnapshot = safeReadLocalStorage<IOfflineSnapshot>(LS_ITEMS_KEY);
    if (lsSnapshot && Array.isArray(lsSnapshot.items)) {
      // Ainda garante limpeza caso sobre algum cookie antigo no navegador
      migrateAndPurgeLegacyCookie();
      return normalizeItems(lsSnapshot.items);
    }

    return migrateAndPurgeLegacyCookie();
  }

  /**
   * Hidratação durável de alta capacidade via IndexedDB (dezenas de MB),
   * com fallback automático para localStorage.
   */
  static async loadDurableSnapshot(): Promise<IOfflineSnapshot | null> {
    const db = await openDatabase();
    if (!db) {
      const fallback = safeReadLocalStorage<IOfflineSnapshot>(LS_ITEMS_KEY);
      return fallback
        ? { ...fallback, items: normalizeItems(fallback.items) }
        : null;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STATE_STORE, 'readonly');
        const store = tx.objectStore(STATE_STORE);
        const req = store.get(CURRENT_LIST_KEY);

        req.onsuccess = () => {
          const result = req.result as IOfflineSnapshot | undefined;
          if (result && Array.isArray(result.items)) {
            resolve({
              items: normalizeItems(result.items),
              total: Number(result.total) || 0,
              updatedAt: Number(result.updatedAt) || 0,
            });
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  static getLocalUpdatedAt(): number {
    const lsSnapshot = safeReadLocalStorage<IOfflineSnapshot>(LS_ITEMS_KEY);
    return lsSnapshot ? Number(lsSnapshot.updatedAt) || 0 : 0;
  }

  /**
   * Salva no espelho síncrono (localStorage) e persiste no banco principal (IndexedDB).
   */
  static async saveListSnapshot(items: IListItem[]): Promise<void> {
    const cleanItems = items.map((item) => ({ ...item }));
    const total = cleanItems.reduce(
      (acc, cur) => (cur.checked ? acc + cur.total : acc),
      0
    );

    const snapshot: IOfflineSnapshot = {
      items: cleanItems,
      total,
      updatedAt: Date.now(),
    };

    safeWriteLocalStorage(LS_ITEMS_KEY, snapshot);

    const db = await openDatabase();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STATE_STORE, 'readwrite');
        const store = tx.objectStore(STATE_STORE);
        store.put(snapshot, CURRENT_LIST_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  static async loadQueue(): Promise<ISyncOperation[]> {
    const db = await openDatabase();
    if (!db) {
      return safeReadLocalStorage<ISyncOperation[]>(LS_QUEUE_FALLBACK_KEY) || [];
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const store = tx.objectStore(QUEUE_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          const list = Array.isArray(req.result) ? (req.result as ISyncOperation[]) : [];
          list.sort((a, b) => a.createdAt - b.createdAt);
          resolve(list);
        };
        req.onerror = () => {
          resolve(safeReadLocalStorage<ISyncOperation[]>(LS_QUEUE_FALLBACK_KEY) || []);
        };
      } catch {
        resolve(safeReadLocalStorage<ISyncOperation[]>(LS_QUEUE_FALLBACK_KEY) || []);
      }
    });
  }

  static async saveQueue(operations: ISyncOperation[]): Promise<void> {
    const cloned = operations.map((op) => ({
      ...op,
      itemSnapshot: op.itemSnapshot ? { ...op.itemSnapshot } : undefined,
    }));

    safeWriteLocalStorage(LS_QUEUE_FALLBACK_KEY, cloned);

    const db = await openDatabase();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(QUEUE_STORE);
        store.clear();
        cloned.forEach((op) => {
          store.put(op);
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}
