//mutations name
import { SAVE_ITEM, CHECKED_ITEM, DELETE_CHECKED} from './typeMutation';

import { createStore, Store, useStore as vuexUseStore} from 'vuex'
import { InjectionKey } from 'vue';

//interfaces
import IListItem from '@/interfaces/IListItem';

export interface State{
  listItem: IListItem[],
  listChecked: IListItem[],
  total: number
}
export const store = createStore<State>({
  state: {
    listItem: [],
    listChecked: [],
    total: 0,
  },
  mutations: {
    [SAVE_ITEM](state, Item: IListItem){
      Item.id = new Date().toISOString().substring(20,24);

      state.listItem.push(Item);
    },
    [CHECKED_ITEM](state, item: IListItem){
      state.listChecked.push(item)
    },
    [DELETE_CHECKED](state, item: IListItem){
      state.listChecked = state.listChecked.filter((it) => {
        // return it.id != item
        return it.id != item.id
      });
    },
  },
  actions: {
  },
  modules: {
  }
})

export const key: InjectionKey<Store<State>> = Symbol();

export default function useStore(){
  return vuexUseStore(key);
}