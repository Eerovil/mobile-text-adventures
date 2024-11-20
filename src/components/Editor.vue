<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, computed } from 'vue';

import { useGameStore } from '../stores/game.ts';
import { useEditorStore } from '../stores/editor.ts';

import EditableScene from './editor/EditableScene.vue';

// This interface contains all keys from Scene and EditorSceneState
import { EditorSceneState } from '../stores/editor.ts';
import { Scene } from '../stores/game.ts';
interface SceneWithMeta extends Scene, EditorSceneState {}

const gameStore = useGameStore();
const editorStore = useEditorStore();

const currentScenes = gameStore.allCurrentScenes;
const currentScenesMeta = editorStore.state.scenes;

const currentScenesWithMeta = computed(() => {
  const ret = {};
  for (const scene of currentScenes) {
    ret[scene.id] = {
      ...scene,
      ...currentScenesMeta.value[scene.id],
    } as SceneWithMeta;
  }
  return ret;
})

</script>

<template>
  <header>
  </header>

  <main>
    <EditableScene v-for="scene in currentScenesWithMeta" :key="scene.id" />
  </main>
</template>