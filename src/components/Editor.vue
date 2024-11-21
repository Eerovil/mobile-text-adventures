<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import Panzoom from '@panzoom/panzoom'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ref, useTemplateRef, computed, onMounted } from 'vue';

import { useGameStore, type SceneId } from '../stores/game';
import { useEditorStore } from '../stores/editor';
import type { SceneWithMeta } from '../stores/editor';

import EditableScene from './editor/EditableScene.vue';

import { usePanzoomStore } from '../stores/panzoom';
const panzoomStore = usePanzoomStore();

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
  const currentScale = panzoomStore.state.currentScale;
  const oldScale = 1;
  const scaledX = (x / oldScale) * currentScale;
  const scaledY = (y / oldScale) * currentScale;
  console.log('Creating scene');
  const scene = gameStore.createScene();
  editorStore.moveScene(scene.id, scaledX, scaledY);
}

const editorRef = useTemplateRef('editor');

onMounted(() => {
  // When right clicking on background, create a new scene
  if (!editorRef.value) {
    throw new Error('Editor ref not found');
  }
  const elem = editorRef.value;
  elem.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    createScene(e.offsetX, e.offsetY);
  });
  const panzoom = Panzoom(elem, {
    maxScale: 10,
    minScale: 0.5,
    excludeClass: 'editable-scene',
  });

  panzoomStore.setPanzoom(panzoom);

  const parent = elem.parentElement
  if (!parent) {
    throw new Error('Editor parent not found');
  }
  // This demo binds to shift + wheel
  parent.addEventListener('wheel', function(event) {
    if (!event.shiftKey) return
    panzoomStore.zoomWithWheel(event)
  })
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