<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import Panzoom from '@panzoom/panzoom'
import ConnectionLine from './editor/ConnectionLine.vue'

import { useTemplateRef, computed, onMounted, ref, watch } from 'vue';

import { useGameStore, type GameProgressionSlug, type SceneId } from '../stores/game';
import { useEditorStore } from '../stores/editor';
import type { SceneWithMeta } from '../stores/editor';

import EditableScene from './editor/EditableScene.vue';

import { usePanzoomStore } from '../stores/panzoom';
import { useConnectionStore } from '@/stores/connections';
const connectionsStore = useConnectionStore();
const panzoomStore = usePanzoomStore();

const gameStore = useGameStore();
const editorStore = useEditorStore();

const currentScenesWithMeta = computed(() => {
  const ret: Record<SceneId, SceneWithMeta> = {};
  for (const scene of gameStore.allCurrentScenes) {
    if (!editorStore.state.scenes[scene.id]) {
      continue;
    }
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
  editorStore.moveScene(scene.id, Math.floor(scaledX), Math.floor(scaledY));
  return scene;
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
    const newScene = createScene(e.offsetX, e.offsetY);
    // If currently connecting, connect to this scene
    if (connectionsStore.state.connectionInProgress) {
      const connection = connectionsStore.finishConnection(newScene.id);
      if (connection) {
        const prompt = window.prompt('Extra prompt for new scene', '') || '';
        gameStore.generateScene(connection, prompt);
      }
    }
  });
  const panzoom = Panzoom(elem, {
    maxScale: 1,
    minScale: 0.01,
    excludeClass: 'editable-scene',
  });

  panzoomStore.setPanzoom(panzoom);

  const parent = elem.parentElement
  if (!parent) {
    throw new Error('Editor parent not found');
  }
  // This demo binds to shift + wheel
  parent.addEventListener('wheel', function (event) {
    if (!event.shiftKey) return
    console.log('wheel', event)
    panzoomStore.zoomWithWheel(event)
  })

  // Add event listener for tab key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      console.log('Tab pressed');
      // Blur current element
      if (document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }
      event.preventDefault();
    }
  });

  // Add event listener for mouse move
  editorRef.value.addEventListener('mousemove', (event) => {
    if (!event.target) {
      return;
    }
    if (event.target !== editorRef.value) {
      return;
    }
    connectionsStore.setMousePosition({
      x: event.offsetX,
      y: event.offsetY,
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      connectionsStore.cancelConnection();
    }
  });

})

const progressionsEnabled = ref<Record<GameProgressionSlug, boolean>>({});

watch(progressionsEnabled, (newProgressionsEnabled) => {
  for (const progressionStr in newProgressionsEnabled) {
    const progression = progressionStr as GameProgressionSlug;
    if (newProgressionsEnabled[progression]) {
      gameStore.addProgression(progression);
    } else {
      gameStore.removeProgression(progression);
    }
  }
}, { deep: true });

const initialSceneId = computed({
  get: () => gameStore.state.initialScene,
  set: (value) => {
    if (!value) {
      return;
    }
    gameStore.setInitialScene(value);
  },
})

const extraPrompt = computed({
  get: () => editorStore.state.extraPrompt,
  set: (value) => {
    editorStore.setExtraPrompt(value || '');
  },
})

</script>

<template>
  <header>
  </header>

  <main ref="editor" id="editor">
    <EditableScene v-for="scene in currentScenesWithMeta" :key="scene.id" :scene-with-meta="scene" />
    <svg class="connections">
      <ConnectionLine v-for="connection in connectionsStore.state.connections" :key="connection.id"
        :connection="connection" />
    </svg>
  </main>

  <div class="sidebar">
    <h2>Initial</h2>
    <input type="text" v-model="initialSceneId" />
    <h2>Progressions</h2>
    <div class="progressions">
      <div v-for="progression in gameStore.allProgressions" :key="progression">
        <input type="checkbox" :id="`progression-${progression}`" v-model="progressionsEnabled[progression]" />
        <label :for="`progression-${progression}`">{{ progression }}</label>
      </div>
    </div>
    <h2>Plot description</h2>
    <textarea v-model="extraPrompt" />
  </div>
</template>

<style scoped>
#editor {
  position: relative;
  width: 100000px;
  height: 100000px;
  background-color: #f0f0f0;
}

.connections {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 200px;
  height: 100vh;
  background-color: #f0f0f0;
  border-right: 1px solid #ccc;
  box-shadow: #000000 0 0 10px;
  color: black;
  padding: 0.5rem;
}

.progressions {
  display: flex;
  flex-direction: column;
}

.progressions input {
  margin-right: 0.5rem;
}
</style>