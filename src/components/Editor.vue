<script setup lang="ts">
import { ref } from 'vue';

const gameStore = useGameStore();

</script>

<template>
  <header>
  </header>

  <main>
    <div v-for="scene in currentScenes" :key="scene.id">
      <Scene :scene="scene" />
  </main>
</template>