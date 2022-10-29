//mutations name
import { SAVE_ITEM } from './typeMutation';

import { createStore, Store, useStore as vuexUseStore} from 'vuex'
import { InjectionKey } from 'vue';

//interfaces
import IListItem from '@/interfaces/IListItem';

export interface State{
  listItem: IListItem[]
}
export const store = createStore<State>({
  state: {
    listItem: []
  },
  mutations: {
    [SAVE_ITEM](state, Item: IListItem){
      Item.id = new Date().toISOString();

      state.listItem.push(Item);
      console.log(Item)
      console.log(state.listItem)
    }
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