import IListItem from '@/interfaces/IListItem';

export type SyncOperationType = 'ADD_ITEM' | 'UPDATE_ITEM' | 'DELETE_ITEM';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';

export interface ISyncOperation {
  id: string;
  type: SyncOperationType;
  itemId: string;
  itemSnapshot?: IListItem;
  createdAt: number;
  retries: number;
}

export interface IOfflineSnapshot {
  items: IListItem[];
  total: number;
  updatedAt: number;
}

export interface ISyncSessionConfig {
  apiUrl?: string;
  token?: string;
  refreshToken?: string;
  listId?: string;
}

export interface IRemoteItemMutationResponse {
  err: string | null;
  msg: string;
  total?: number;
}
