<template>

	<div v-for="(listaItem, index) in listaItens" :key="index">
		<ItensNoChecked :checkedList=false :listaItem=listaItem :index=index @ao-item-clicked="clickedItem"
			v-if="!listaItem.checked" />
	</div>


	<h3>Checked</h3>

	<div v-for="(listaItem, index) in listaItens" :key="index">
		<ItensNoChecked :checkedList=true :listaItem=listaItem :index=index @ao-item-clicked="clickedItem"
			v-if="listaItem.checked" />
	</div>

	<p> {{ totalItensPrice }}</p>
</template>


<script lang="ts">

//UTILS IMPORT's
import useStore from '@/store';
import { computed, defineComponent } from 'vue';

//COMPONENTS IMPORT's
import ItensNoChecked from '@/components/ItensNoChecked.vue'

//INTERFACES IMPORT's
import IListItem from '@/interfaces/IListItem';

//MUTATION/ACTION VARIABLE IMPORT's
import { CHECKED_ITEM } from '@/store/typeMutation';

export default defineComponent({
	name: 'ItemListedView',
	components: {
		ItensNoChecked,
	},
	methods: {
		clickedItem(item: IListItem) {

			this.store.commit(CHECKED_ITEM, item);
			console.log('Lista', this.store.state.listItem)
		},
	},
	setup() {
		const store = useStore();
		return {
			store,
			totalItensPrice: computed(() => store.state.total.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })),
			listaItens: computed(() => store.state.listItem),
		}
	}
})
</script>

<style>

</style>