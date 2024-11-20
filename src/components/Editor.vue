<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, useTemplateRef, computed, onMounted } from 'vue';

import { useGameStore, type SceneId } from '../stores/game';
import { useEditorStore } from '../stores/editor';
import type { SceneWithMeta } from '../stores/editor';

import EditableScene from './editor/EditableScene.vue';

const gameStore = useGameStore();
const editorStore = useEditorStore();

const currentScenesWithMeta = computed(() => {
  const ret: Record<SceneId, SceneWithMeta> = {};
  for (const scene of gameStore.allCurrentScenes) {
    ret[scene.id] = {
      ...scene,
      ...editorStore.state.scenes[scene.id],
    } as SceneWithMeta;
  }
  return ret;
})

const createScene = (x: number, y: number) => {
  console.log('Creating scene');
  const scene = gameStore.createScene();
  editorStore.moveScene(scene.id, x, y);
}

const editorRef = useTemplateRef('editor');
onMounted(() => {
  // When right clicking on background, create a new scene
  if (!editorRef.value) {
    throw new Error('Editor ref not found');
  }
  editorRef.value.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    createScene(e.offsetX, e.offsetY);
  });
})


</script>

<template>
  <header>
  </header>

  <main ref="editor" id="editor">
    <EditableScene v-for="scene in currentScenesWithMeta" :key="scene.id" :scene-with-meta="scene" />
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