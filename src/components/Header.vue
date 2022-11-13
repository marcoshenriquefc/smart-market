<template>
	<header class="headerMenu">
		<h1 class="logo">Smart <span class="marketName">market</span></h1>
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

.logo{
	font-size: 32px;
	text-transform: uppercase;
	font-weight: 900;
}
.marketName{
	color: white;
	font-weight: 200;
	font-size: 20px;
	
	text-transform: lowercase;
}
</style>