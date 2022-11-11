<template>

    <section v-for="(listaItem, index) in listaItens" :key="index">
        <ItensNoChecked
            :listaItem=listaItem
            :index=index
            @ao-item-clicked="clickedItem"
        />
    </section>

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
import { CHECKED_ITEM, DELETE_CHECKED } from '@/store/typeMutation';

export default defineComponent({
    name: 'ItemListedView',
    components:{
        ItensNoChecked,
    },
    methods:{
        clickedItem(item: IListItem) {
			const indexList: number = this.store.state.listChecked.findIndex(it => {
				return item.id == it.id
			})
			if (indexList < 0) {
				this.store.commit(CHECKED_ITEM, item);
			}
			else {
				this.store.commit(DELETE_CHECKED, item)
			}
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