<template>
  <button class="buttonMain" :class="cor" @click="clicado()">
    <slot></slot>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name:'ButtonMain',
    emits: ['aoClicado'],
    props: {
      cor: {
        type: String,
        required: true,
      },
    },
    methods: {
      clicado() {
        this.$emit('aoClicado');
      }
    }
  })
</script>

<style scoped>
.buttonMain{
  padding: 8px 32px;

  border: none;
  border-radius: 16px;

  cursor: pointer;
}

.buttonMain.green{
  background-color: #1F3324;
  color: #F8F8F8;
}
.buttonMain.lightGreen{
  background-color: #08912a;
  color: #F8F8F8;
}
.buttonMain.lightGreen:hover{
  background-color: #4da964;
}

.buttonMain.red{
  background-color: #6d0909;
  color: #F8F8F8;
}
.buttonMain.red:hover{
  background-color: #9a4444;
}
</style>