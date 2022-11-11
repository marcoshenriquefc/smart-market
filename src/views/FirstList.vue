<template>
	<main id="mainArea">
		<div class="topArea">
			<HeaderMenu />
			<FormAdd />
		</div>
		<div class="botomArea">
			<!-- <ListItens /> -->

			<ItemListedView/>
		</div>

	</main>

</template>

<script lang="ts">
import { defineComponent } from 'vue';
import HeaderMenu from '@/components/Header.vue'
import FormAdd from '@/components/formAdd.vue'
import ItemListedView from '@/views/ItensListed.vue'
// import ListItens from '@/components/ListItens.vue'

export default defineComponent({
	name: "FirstList",
	components: {
		HeaderMenu,
		FormAdd,
		ItemListedView,
		// ListItens,
	}
})
</script>

<style>
#mainArea {
	height: 100vh;
	background-color: #F2F2F2;
}

.topArea {
	z-index: 1;
	background-color: #75BF7A;
	padding-bottom: 20px;
}

.botomArea {
	background-color: #F2F2F2;
	border-radius: 20px;

	min-height: 150px;

	padding: 12px;
	padding-bottom: 40px;
	z-index: 2;
	margin-top: -20px;

	box-shadow: 0 -5px 10px 0 rgba(0, 0, 0, 0.1);

	max-height: calc(100% - 200px);
	overflow-y: auto;
}
</style>