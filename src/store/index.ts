//mutations name
import { SAVE_ITEM, CHECKED_ITEM, TOTAL_CALC, EDIT_ITEM, SAVE_COOKIE, GET_ITENS_COOKIES, DELETE_ITEM} from './typeMutation';

import { createStore, Store, useStore as vuexUseStore} from 'vuex'
import { InjectionKey } from 'vue';


import { Util } from '@/utils/cookies'

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

    // CRUD ITEM IN VARIABLE 
    [SAVE_ITEM](state, Item: IListItem){
      Item.id = new Date().toISOString().substring(20,24);
      Item.checked = false;

      state.listItem.push(Item);
      
      store.commit(TOTAL_CALC)
    },
    [EDIT_ITEM](state, item: IListItem){
      item.total = item.quantity * item.price;
      
      const indexList = state.listItem.findIndex(it => {
				return item.id == it.id
			})

      state.listItem[indexList] = item
      store.commit(TOTAL_CALC)
    },
    [DELETE_ITEM](state, item: IListItem){
      const itens = state.listItem.filter( it => {
        return it.id != item.id
      });

      state.listItem = itens
      store.commit(TOTAL_CALC)
    },

    [CHECKED_ITEM](state, item: IListItem){
      const indexList = state.listItem.findIndex(it => {
				return item.id == it.id
			});
      state.listItem[indexList].checked = !state.listItem[indexList].checked;
      
      store.commit(TOTAL_CALC)
    },

    [TOTAL_CALC](state){
      state.total = 0
      state.listItem.forEach(element => {
        if(element.checked){
          state.total += element.total
        }
      })

      store.commit(SAVE_COOKIE)
    },


    //COOKIES
    [SAVE_COOKIE](state){
      Util.setCookie('Itens', state.listItem, {
        expres: new Date((new Date()).setFullYear(new Date().getFullYear() + 1)),
        path: '',
      })
    },
    [GET_ITENS_COOKIES](state){

      const itensCookie = Util.getCookie('Itens')

      if(itensCookie){
        state.listItem = JSON.parse(itensCookie)
        store.commit(TOTAL_CALC)
      }
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