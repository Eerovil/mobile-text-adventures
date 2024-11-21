<script setup lang="ts">
import { useDraggablePanzoom } from '@/composables/useDraggablePanzoom';

import { defineProps, useTemplateRef } from 'vue';

import type { SceneWithMeta } from '../../stores/editor';

const props = defineProps<{
  sceneWithMeta: SceneWithMeta;
}>();

useDraggablePanzoom(props.sceneWithMeta, useTemplateRef('draggableElementRef'));

</script>
<template>
  <div ref="draggableElementRef" class="editable-scene">
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
