<template>
	<header class="headerMenu">
		<h1>Logotipo</h1>
	</header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
	name: "HeaderMenu",
})
</script>
<style scoped>
.headerMenu {
	text-align: center;
	background-color: #75BF7A;

	padding: 8px 0;
	padding-top: 32px;
}
</style>