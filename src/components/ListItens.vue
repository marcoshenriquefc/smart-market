<template>
  <div v-for="(listaItem, index) in listaItens" :key="index">
    <input type="checkbox" name="" :id="listaItem.id" class="itemCheck" :value="listaItem.name" v-model="checkeditens">
    <label class="item" :for="listaItem.id">
      <h1 class="itemName"><strong> {{ listaItem.name }} </strong></h1> 
      
      <div class="pricesArea">
        <p class="uniPrice"> {{ listaItem.price.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}) }}</p>
        <p class="totalPrice"> {{ listaItem.total.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'}) }} </p>
      </div>

      <div class="quantityArea">
         <ButtonQuantity class="quantityChange"> - </ButtonQuantity>
         {{ listaItem.quantity }}
         <ButtonQuantity class="quantityChange"> + </ButtonQuantity>
      </div>

      <ButtonQuantity class="deleteItem"> x </ButtonQuantity>
    </label>
  </div>

  <p>{{ checkeditens }}</p>

</template>

<script lang="ts">
import useStore from '@/store';
import { computed } from '@vue/reactivity';
import { defineComponent } from 'vue';

import ButtonQuantity from '@/components/ButtonQuantity.vue'

export default defineComponent({
  name: "ListaItens",
  components:{
    ButtonQuantity
  },
  data(){
    return{
      checkeditens: []
    }
  },
  setup() {
    const store = useStore()
    return {
      listaItens: computed(() => store.state.listItem)
    }
  }
})
</script>

<style scoped>
.itemCheck {
  display: none;
}

.itemCheck:checked~.item {
  background-color: #D9D9D9;
}
.itemCheck:checked~.item *{
  text-decoration: line-through;
  color: gray;
}
.item {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;

  background-color: #F8F8F8;
  color: #1F3324;
  /* background-color: #fbfbfb; */

  box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.2);
  padding: 20px;
  margin: 20px 12px;

  border-radius: 8px;
  cursor: pointer;
}

.itemName{
  grid-column: 1/5;
  font-size: 20px;
}

.pricesArea{
  text-align: end;
}
.pricesArea .uniPrice{
  color: #9a9a9a;
  font-size: 12px;
}
.pricesArea .totalPrice{
  font-weight: 900;
  font-size: 16px;
}

.quantityArea{
  grid-column: 1/5;
}
.quantityChange{
  background: #99ffb36a;
  color: #1F3324;
  /* border: 1px solid #75BF7A; */
}
.deleteItem{
  grid-column: 5/-1;
  background: #ff99996a;
  color: #650f0f;
}
</style>

<style>

</style>