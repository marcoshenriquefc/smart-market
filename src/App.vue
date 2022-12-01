<template>
  <FirstList/>
</template>

<script lang="ts">
  import FirstList from '@/views/FirstList.vue'
  import { defineComponent } from 'vue';

  export default defineComponent({
    name: "App",
    components: {
      FirstList
    },
    methods: {
      botaoclick(){
        console.log('mandou')
      }
    }

  })
</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');
*{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Ubuntu', sans-serif;
}

body{
  background-color: #F8F8F8;
}
</style>
