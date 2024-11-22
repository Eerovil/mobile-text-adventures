<script setup lang="ts">
import { ref } from 'vue';
import Editor from './components/Editor.vue';
import GameSelect from './components/GameSelect.vue';

// If query string contains "edit", enable editing mode
const query = new URLSearchParams(window.location.search);
const isEditing = ref<boolean>(query.has('edit'));

</script>

<template>
  <header>
  </header>

  <main id="app-main">
    <Editor v-if="isEditing" />
    <GameSelect v-else />
  </main>
</template>

<style>
#app,
#app-main {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
