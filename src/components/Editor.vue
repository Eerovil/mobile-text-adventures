<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, useTemplateRef, computed, onMounted } from 'vue';

import { useGameStore } from '../stores/game.ts';
import { useEditorStore } from '../stores/editor.ts';

import EditableScene from './editor/EditableScene.vue';

// This interface contains all keys from Scene and EditorSceneState
import { EditorSceneState } from '../stores/editor.ts';
import { Scene } from '../stores/game.ts';
interface SceneWithMeta extends Scene, EditorSceneState {}

const gameStore = useGameStore();
const editorStore = useEditorStore();

const currentScenesWithMeta = computed(() => {
  const ret = {};
  for (const scene of gameStore.allCurrentScenes) {
    ret[scene.id] = {
      ...scene,
      ...editorStore.state.scenes[scene.id],
    } as SceneWithMeta;
  }
  return ret;
})

const createScene = () => {
  console.log('Creating scene');
  console.log(gameStore.createScene());
}

const editorRef = useTemplateRef('editor');
onMounted(() => {
  // When right clicking on background, create a new scene
  editorRef.value.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    createScene();
  });
})


</script>

<template>
  <header>
  </header>

  <main ref="editor" id="editor">
    <EditableScene v-for="scene in currentScenesWithMeta" :key="scene.id" />
  </main>
</template>

<style scoped>
#editor {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
}
</style>