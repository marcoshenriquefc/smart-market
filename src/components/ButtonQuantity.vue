<template>
  <button class="buttonQuantity" @click="clicked">
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ButtonQuantity',
  emits:['aoClickButton'],
  methods:{
    clicked(){
      this.$emit('aoClickButton');
    }
  }
})
</script>

<style scoped>
.buttonQuantity{
  width: 30px;
  height: 30px;

  font-weight: 700;
  font-size: 16px;
  border-radius: 50%;

  border: none;

  cursor: pointer;
}
</style>