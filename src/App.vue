<script setup lang="ts">
import Editor from './components/Editor.vue';
</script>

<template>
  <header>
  </header>

  <main id="app-main">
    <Editor />
  </main>
</template>

<style>
#app, #app-main {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
