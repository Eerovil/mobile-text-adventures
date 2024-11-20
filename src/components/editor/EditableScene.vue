<script setup lang="ts">
import { computed, defineProps, useTemplateRef, onMounted } from 'vue';

import type { SceneWithMeta } from '../../stores/editor';

import { useEditorStore } from '../../stores/editor';
const editorStore = useEditorStore();

const props = defineProps<{
  sceneWithMeta: SceneWithMeta;
}>();
const x = computed(() => props.sceneWithMeta.x);
const y = computed(() => props.sceneWithMeta.y);

const editableSceneRef = useTemplateRef('editableScene');
onMounted(() => {
  if (!editableSceneRef.value) {
    throw new Error('EditableScene ref not found');
  }
  editableSceneRef.value.addEventListener('contextmenu', (e) => {
    console.log('Right click on scene');
    e.preventDefault();
    // Don't bubble up to the editor
    e.stopPropagation();
  });
  // Make the scene draggable
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  editableSceneRef.value.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.offsetX;
    offsetY = e.offsetY;
  });
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      editorStore.moveScene(props.sceneWithMeta.id, e.clientX - offsetX, e.clientY - offsetY);
    }
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
  });
})

</script>
<template>
  <div ref="editableScene" class="editable-scene" :style="{top: `${y}px`, left: `${x}px`}">
    <h1>EditableScene</h1>
  </div>
</template>

<style scoped>
.editable-scene {
  position: absolute;
  background-color: #f0f0f0;
  width: 50px;
  height: 50px;
  border: 1px solid #000;
}
</style>
