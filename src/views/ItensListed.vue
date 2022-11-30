<template>
	<section v-if="listaItens.length >= 1">
		<h3 v-if="(listaItens.findIndex( i => i.checked == false)) !== -1">No Checked</h3>
		<div v-for="(listaItem, index) in listaItens" :key="index">
			<ItensList
				v-if="!listaItem.checked"
				:checkedList=false
				:listaItem=listaItem
				:index=index
				@ao-item-clicked="clickedItem"
				@ao-edit-item="editItem"
			/>
		</div>

		<h3 v-if="(listaItens.findIndex( i => i.checked == true)) !== -1">Checked</h3>
		<div v-for="(listaItem, index) in listaItens" :key="index">
			<ItensList
				v-if="listaItem.checked"
				:checkedList=true
				:listaItem=listaItem
				:index=index
				@ao-item-clicked="clickedItem"
				@ao-edit-item="editItem"
			/>
		</div>
	</section>

	<section id="popup-area" v-if="itemClicked">
		<form class="popup-edit" @submit.prevent="confirmEdit">
			<h2>Edit Item</h2>
			<div class="box-input-popup">
				<div>
					<label for="name-item-popup">Name:</label>
					<input v-model="itemClicked.name" class="input-base" type="text" name="name-item" id="name-item-popup" placeholder="Digite o nome do produto" required />
				</div>
				<div class="box-value">
					<div>
						<label for="quantity-item">Quantity</label>
						<input v-model="itemClicked.quantity" class="input-base" type="number" name="quantity-item" id="quantity-item-popup" placeholder="01" min="1" required />
					</div>
					<div>
						<label for="price-item">Price</label>
						<input v-model="itemClicked.price" class="input-base" type="number" step="0.01" name="price-item" id="price-item-popup" placeholder="R$ 0,00/unidade" />
					</div>
				</div>
			</div>
			<div class="buton-area">
				<!-- <ButtonMain @ao-clicado="cancelEdit" cor="red">Cancel</ButtonMain> -->
				<ButtonMain cor="lightGreen">Confirm</ButtonMain>
			</div>
		</form>
	</section>
	<!-- <p> {{ totalItensPrice }}</p> -->
</template>


<script lang="ts">
//UTILS IMPORT's
import useStore from '@/store';
import { computed, defineComponent } from 'vue';

//COMPONENTS IMPORT's
import ItensList from '@/components/ItensList.vue'
import ButtonMain from '@/components/ButtonMain.vue'

//INTERFACES IMPORT's
import IListItem from '@/interfaces/IListItem';

//MUTATION/ACTION VARIABLE IMPORT's
import { CHECKED_ITEM, EDIT_ITEM, GET_ITENS_COOKIES } from '@/store/typeMutation';

export default defineComponent({
	name: 'ItemListedView',
	data(){
		return{
			itemClicked: null as IListItem | null
		}
	},
	components: {
		ItensList,
		ButtonMain
	},
	methods: {
		clickedItem(item: IListItem) {
			this.store.commit(CHECKED_ITEM, item);
			// console.log('Lista', this.store.state.listItem)
		},
		editItem(item: IListItem){
			let item2 = item
			// this.itemClicked = item
			this.itemClicked = item2
		},
		cancelEdit(){
			this.itemClicked = null
		},
		confirmEdit(){
			console.log(this.itemClicked)

			this.store.commit(EDIT_ITEM, this.itemClicked)
			this.itemClicked = null
		}
	},
	setup() {
		const store = useStore();
		store.commit( GET_ITENS_COOKIES)

		return {
			store,
			// totalItensPrice: computed(() => store.state.total.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })),
			listaItens: computed(() => store.state.listItem),
		}
	}
})
</script>

<style>
#popup-area{
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 5%;
	position: fixed;
	top: 0;
	left: 0;
	
	width: 100%;
	height: 100%;

	background-color: rgba(0, 0, 0, 0.467);
}

.box-input-popup {
	display: flex;
	flex-direction: column;
	grid-template-columns: repeat(8, 1fr);

	gap: 8px;
	padding: 8px 0;
	width: 100%;
}

#quantity-item-popup {
	width: 100%;
}

#name-item-popup {
	width: 100%;
}

#price-item-popup {
	width: 100%;
}

.popup-edit{
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 4px 4px 10px 0 rgba(0, 0, 0, 0.5);
	background-color: #f8f8f8;
}
.input-base {
	font-size: 12px;
	padding: 8px 4px;

	width: 100%;
}

.box-value{
	display: flex;
	gap: 20px;
}

.buton-area{
	display: flex;
	justify-content: center;
	gap: 20px;
}
</style>