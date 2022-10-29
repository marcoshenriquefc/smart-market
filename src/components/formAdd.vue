<template>
  <form action="" class="form-area" @submit.prevent="addItemList">
    <div class="box-input">
      <input v-model="quantityItem" class="input-base" type="number" name="quantity-item" id="quantity-item" placeholder="01" min="1" required />
      <input v-model="nameItem" class="input-base" type="text" name="name-item" id="name-item" placeholder="Digite o nome do produto" required />
      <input v-model="priceItem" class="input-base" type="number" step="0.01" name="price-item" id="price-item" placeholder="R$ 0,00/unidade" />
    </div>
    <div class="box-button">
      <ButtonMain cor="green">
        Adicionar
      </ButtonMain>
    </div>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import ButtonMain from '@/components/ButtonMain.vue'

import useStore from '@/store'
import { SAVE_ITEM } from '@/store/typeMutation';
import { computed } from '@vue/reactivity';


export default defineComponent({
  name: 'FormAdd',
  components: {
    ButtonMain
  },
  data() {
    return {
      quantityItem: 1,
      nameItem: '',
      priceItem: 0,
    }
  },
  methods:{
    addItemList(){
      this.store.commit(SAVE_ITEM, {
        quantity: this.quantityItem,
        name: this.nameItem || 'Nome não definido',
        price: this.priceItem,
        total: (this.quantityItem * this.priceItem)
      })

      this.quantityItem = 1;
      this.nameItem = '',
      this.priceItem = 0
    }
  },
  setup(){
    const store = useStore();

    return{
      store,
      listaItens: computed(()=> store.state.listItem)
    }
  }
})
</script>

<style scoped>

.form-area{
  padding: 12px;
}
.box-input {
  display: grid;
  grid-template-columns: repeat(8, 1fr);

  gap: 8px;
  padding: 8px 0;
}

#quantity-item {
  grid-column: 1/2;
}

#name-item {
  grid-column: 2/7;
}

#price-item {
  grid-column: 7/-1;
}


.input-base {
  font-size: 12px;
  padding: 8px 4px;

  width: 100%;
}
.box-button{
  display: flex;
  justify-content: end;
  width: 100%;

  padding: 8px 0;
}
</style>