<script setup lang="ts">
import { useDraggablePanzoom } from '@/composables/useDraggablePanzoom';

import { ref, defineProps, useTemplateRef, onMounted, type Ref } from 'vue';

import type { SceneWithMeta } from '@/stores/editor';
import { useGameStore } from '@/stores/game';
const gameStore = useGameStore();

const props = defineProps<{
  sceneWithMeta: SceneWithMeta;
}>();

const { zoomLevel } = useDraggablePanzoom(props.sceneWithMeta, useTemplateRef('draggableElementRef'));

const title = useTemplateRef('title');
const text = useTemplateRef('text');
const editingElement: Ref<HTMLElement | null> = ref(null);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setTitle = (event: FocusEvent) => {
  if (!title.value) {
    return;
  }
  gameStore.setSceneValue(props.sceneWithMeta.id, 'title', title.value.innerText.trim());
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setText = (event: FocusEvent) => {
  if (!text.value) {
    return;
  }
  gameStore.setSceneValue(props.sceneWithMeta.id, 'text', text.value.innerText.trim());
};

const setEditingElement = (element: string) => {
  if (element === 'title') {
    editingElement.value = title.value;
  } else if (element === 'text') {
    editingElement.value = text.value;
  }
};

onMounted(() => {
  // When clicking outside of "editingElement", blur it
  window.addEventListener('click', (event) => {
    if (editingElement.value && editingElement.value !== event.target) {
      editingElement.value.blur();
    }
  });
});

</script>
<template>
  <div ref="draggableElementRef" class="draggable-element editable-scene" :class="{ tiny: zoomLevel < 0.05 }">
    <h1 ref="title" class="not-draggable" contenteditable spellcheck="false" @mousedown="setEditingElement('title')"
      @blur="setTitle">{{
        sceneWithMeta.title }}</h1>
    <p ref="text" class="not-draggable" contenteditable spellcheck="false" @mousedown="setEditingElement('text')"
      @blur="setText">{{
        sceneWithMeta.text }}</p>
  </div>
</template>

<style scoped>
.editable-scene {
  position: absolute;
  background-color: #8d9aff;
  width: 500px;
  height: 500px;
  border: 1px solid #000;
  color: black;
}

.editable-scene.tiny {
  border: 10px solid #000;
}

.editable-scene.tiny * {
  display: none;
}
</style>
