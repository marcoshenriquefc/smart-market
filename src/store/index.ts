import {
  SAVE_ITEM,
  CHECKED_ITEM,
  TOTAL_CALC,
  EDIT_ITEM,
  PERSIST_STORAGE,
  LOAD_STORAGE,
  DELETE_ITEM,
  RESTORE_ITEM,
  HYDRATE_OFFLINE_ITEMS,
  SET_SYNC_STATE,
} from './typeMutation';

import { createStore, Store, useStore as vuexUseStore } from 'vuex';
import { InjectionKey } from 'vue';

import IListItem from '@/interfaces/IListItem';
import { SyncStatus } from '@/interfaces/ISync';
import { OfflineStorage } from '@/services/offlineStorage';
import { syncManager } from '@/services/syncManager';
import { generateUUID } from '@/utils/uuid';

export interface State {
  listItem: IListItem[];
  total: number;
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  hydrated: boolean;
}

function calculateCheckedTotal(items: IListItem[]): number {
  return items.reduce((sum, el) => (el.checked ? sum + el.total : sum), 0);
}

export const store = createStore<State>({
  state: {
    listItem: [],
    total: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncStatus:
      typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
    pendingSyncCount: 0,
    hydrated: false,
  },
  mutations: {
    // Optimistic UI (0 ms): atualiza na tela imediatamente e enfileira sincronização em background
    [SAVE_ITEM](state, itemPayload: IListItem) {
      const quantity = Number(itemPayload.quantity) > 0 ? Number(itemPayload.quantity) : 1;
      const price = Number(itemPayload.price) >= 0 ? Number(itemPayload.price) : 0;

      const newItem: IListItem = {
        id: generateUUID(),
        name: String(itemPayload.name || 'Nome não definido'),
        quantity,
        price,
        total: quantity * price,
        checked: false,
      };

      state.listItem.push(newItem);
      void syncManager.enqueue('ADD_ITEM', { item: newItem });
      store.commit(TOTAL_CALC);
    },

    [EDIT_ITEM](state, item: IListItem) {
      const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
      const price = Number(item.price) >= 0 ? Number(item.price) : 0;
      const updated: IListItem = {
        ...item,
        quantity,
        price,
        total: quantity * price,
      };

      const indexList = state.listItem.findIndex((it) => updated.id === it.id);
      if (indexList !== -1) {
        state.listItem[indexList] = updated;
        void syncManager.enqueue('UPDATE_ITEM', { item: updated });
      }
      store.commit(TOTAL_CALC);
    },

    [DELETE_ITEM](state, item: IListItem) {
      state.listItem = state.listItem.filter((it) => it.id !== item.id);
      void syncManager.enqueue('DELETE_ITEM', { item });
      store.commit(TOTAL_CALC);
    },

    [RESTORE_ITEM](state, payload: { item: IListItem; index: number }) {
      const alreadyExists = state.listItem.some((it) => it.id === payload.item.id);
      if (!alreadyExists) {
        const restored = { ...payload.item };
        const safeIndex = Math.min(Math.max(payload.index, 0), state.listItem.length);
        state.listItem.splice(safeIndex, 0, restored);
        void syncManager.enqueue('ADD_ITEM', { item: restored });
        store.commit(TOTAL_CALC);
      }
    },

    [CHECKED_ITEM](state, item: IListItem) {
      const indexList = state.listItem.findIndex((it) => item.id === it.id);
      if (indexList === -1) return;

      const toggled: IListItem = {
        ...state.listItem[indexList],
        checked: !state.listItem[indexList].checked,
      };
      state.listItem[indexList] = toggled;
      void syncManager.enqueue('UPDATE_ITEM', { item: toggled });
      store.commit(TOTAL_CALC);
    },

    [TOTAL_CALC](state) {
      state.total = calculateCheckedTotal(state.listItem);
      store.commit(PERSIST_STORAGE);
    },

    // Persistência local Offline-First (localStorage ~5 MB + IndexedDB dezenas de MB)
    [PERSIST_STORAGE](state) {
      void OfflineStorage.saveListSnapshot(state.listItem);
    },

    [LOAD_STORAGE](state) {
      if (state.hydrated) return;
      const instantItems = OfflineStorage.loadInstantSnapshot();
      state.listItem = instantItems;
      state.total = calculateCheckedTotal(instantItems);
      state.hydrated = true;
    },

    [HYDRATE_OFFLINE_ITEMS](state, durableItems: IListItem[]) {
      state.listItem = durableItems;
      state.total = calculateCheckedTotal(durableItems);
      state.hydrated = true;
    },

    [SET_SYNC_STATE](
      state,
      payload: {
        isOnline: boolean;
        status: SyncStatus;
        pendingCount: number;
        serverTotal?: number;
      }
    ) {
      state.isOnline = payload.isOnline;
      state.syncStatus = payload.status;
      state.pendingSyncCount = payload.pendingCount;
      if (
        payload.pendingCount === 0 &&
        typeof payload.serverTotal === 'number' &&
        Number.isFinite(payload.serverTotal)
      ) {
        state.total = payload.serverTotal;
      }
    },
  },
  actions: {
    async initOfflineEngine({ commit, state }) {
      if (!state.hydrated) {
        commit(LOAD_STORAGE);
      }

      syncManager.subscribe((syncSnapshot) => {
        commit(SET_SYNC_STATE, syncSnapshot);
      });

      const localUpdatedAt = OfflineStorage.getLocalUpdatedAt();
      const durableSnapshot = await OfflineStorage.loadDurableSnapshot();
      if (
        durableSnapshot &&
        (durableSnapshot.updatedAt > localUpdatedAt ||
          (state.listItem.length === 0 && durableSnapshot.items.length > 0 && localUpdatedAt === 0))
      ) {
        commit(HYDRATE_OFFLINE_ITEMS, durableSnapshot.items);
      } else if (state.listItem.length > 0) {
        await OfflineStorage.saveListSnapshot(state.listItem);
      }

      await syncManager.init();
    },
  },
  modules: {},
});

export const key: InjectionKey<Store<State>> = Symbol();

export default function useStore() {
  return vuexUseStore(key);
}
