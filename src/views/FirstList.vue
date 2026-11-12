<template>
	<main id="mainArea">
		<div class="topArea">
			<HeaderMenu />
		</div>

		<div class="botomArea">
			<div class="listContainer">
				<ItemListedView />
			</div>
		</div>

		<FormAdd />
	</main>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import HeaderMenu from '@/components/Header.vue';
import FormAdd from '@/components/formAdd.vue';
import ItemListedView from '@/views/ItensListed.vue';

export default defineComponent({
	name: 'FirstList',
	components: {
		HeaderMenu,
		FormAdd,
		ItemListedView,
	},
});
</script>

<style>
#mainArea {
	height: 100vh;
	height: 100dvh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	background-color: #F2F2F2;
}

.topArea {
	z-index: 1;
	flex-shrink: 0;
	background-color: #75BF7A;
	padding-bottom: 24px;
}

.botomArea {
	flex: 1;
	background-color: #F2F2F2;
	border-radius: 20px 20px 0 0;
	padding: 14px 12px calc(98px + env(safe-area-inset-bottom, 0px));
	z-index: 2;
	margin-top: -20px;
	box-shadow: 0 -5px 10px 0 rgba(0, 0, 0, 0.1);
	overflow-y: auto;
	-webkit-overflow-scrolling: touch;
}

.listContainer {
	max-width: 600px;
	margin: 0 auto;
}
</style>
