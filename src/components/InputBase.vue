<template>
  <input class="input-base" 
    :type="typeInput" 
    :name="nameInput" 
    :id="nameInput" 
    :placeholder="placeholderInput"
    :required="requiredInput"
  >
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'InputBase',
  props: {
    typeInput: {
      type: String,
      required: true
    },
    nameInput:{
      type: String,
      required:true
    },
    requiredInput: Boolean,
    placeholderInput: String
  }
})
</script>

<style scoped>
.input-base{
	font-size: 12px;
	padding: 8px 4px;

	width: 100%;
}
</style>