//mutations name
import { SAVE_ITEM, CHECKED_ITEM, TOTAL_CALC} from './typeMutation';

import { createStore, Store, useStore as vuexUseStore} from 'vuex'
import { InjectionKey } from 'vue';

//interfaces
import IListItem from '@/interfaces/IListItem';

export interface State{
  listItem: IListItem[],
  total: number
}
export const store = createStore<State>({
  state: {
    listItem: [],
    total: 0,
  },
  mutations: {
    [SAVE_ITEM](state, Item: IListItem){
      Item.id = new Date().toISOString().substring(20,24);
      Item.checked = false;

      state.listItem.push(Item);
    },
    [CHECKED_ITEM](state, item: IListItem){
      const indexList = state.listItem.findIndex(it => {
				return item.id == it.id
			})
      state.listItem[indexList].checked = !state.listItem[indexList].checked
      
      store.commit(TOTAL_CALC)
    },
    [TOTAL_CALC](state){
      state.total = 0
      state.listItem.forEach(element => {
        if(element.checked){
          state.total += element.total
        }
      })
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