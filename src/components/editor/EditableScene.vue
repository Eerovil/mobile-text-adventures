<script setup lang="ts">
import EditableAction from '@/components/editor/EditableAction.vue';
import { useDraggablePanzoom } from '@/composables/useDraggablePanzoom';

import { ref, defineProps, useTemplateRef, onMounted, type Ref, watch } from 'vue';

import { useConnectionStore } from '@/stores/connections';
import { useEditorStore, type SceneWithMeta } from '@/stores/editor';
import { useGameStore } from '@/stores/game';
const gameStore = useGameStore();
const connectionsStore = useConnectionStore();

const props = defineProps<{
  sceneWithMeta: SceneWithMeta;
}>();

const { zoomLevel, draggableElementRef } = useDraggablePanzoom(props.sceneWithMeta, useTemplateRef('draggableElementRef'));

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

const createAction = () => {
  gameStore.createAction(props.sceneWithMeta.id);
};

onMounted(() => {
  // When clicking outside of "editingElement", blur it
  window.addEventListener('click', (event) => {
    if (editingElement.value && editingElement.value !== event.target) {
      editingElement.value.blur();
    }
  });

  // Add event listener for mouse move
  if (!draggableElementRef.value) {
    throw new Error('Draggable element ref not found');
  }
  draggableElementRef.value.addEventListener('mousemove', () => {
    connectionsStore.setMousePosition({
      x: props.sceneWithMeta.x,
      y: props.sceneWithMeta.y,
    });
  });
  updateActionPositions();
  draggableElementRef.value.addEventListener('click', (event) => {
    gameStore.goToScene(props.sceneWithMeta.id);
    // alt/option + click
    if (event.altKey) {
      gameStore.deleteScene(props.sceneWithMeta.id);
    }
  });
});

const editorStore = useEditorStore();
const updateActionPositions = () => {
  setTimeout(() => {
    const elem = draggableElementRef.value;
    if (!elem) {
      return;
    }
    const positions = [];
    for (let i = 0; i < props.sceneWithMeta.actions.length; i++) {
      const actionElement = elem.querySelector(`.editable-action[data-index="${i}"]`) as HTMLElement | null;
      if (!actionElement) {
        console.log('Action element not found', i);
        continue;
      }
      // Get position within scene
      const x = actionElement.offsetLeft + actionElement.offsetWidth / 2;
      const y = actionElement.offsetTop + actionElement.offsetHeight / 2;
      console.log('Setting action position', i, x, y);
      positions.push({ x, y });
    }
    editorStore.setActionPositions(props.sceneWithMeta.id, positions);
  }, 1)
};

watch(props.sceneWithMeta.actions, () => {
  console.log('Actions changed');
  updateActionPositions();
});

</script>
<template>
  <div ref="draggableElementRef" class="draggable-element editable-scene" :class="{ tiny: zoomLevel < 0.05 }"
    @click="connectionsStore.finishConnection(props.sceneWithMeta.id);">
    <div class="values">
      <h1 ref="title" class="not-draggable" contenteditable spellcheck="false" @mousedown="setEditingElement('title')"
        @blur="setTitle">{{
          sceneWithMeta.title }}</h1>
      <p ref="text" class="not-draggable" contenteditable spellcheck="false" @mousedown="setEditingElement('text')"
        @blur="setText">{{
          sceneWithMeta.text }}</p>
    </div>

    <div class="actions">
      <EditableAction v-for="(action, index) in sceneWithMeta.actions" :key="index" :action="action" :data-index="index"
        :action-index="index" :scene-id="sceneWithMeta.id" />
      <button @click="createAction">Create action</button>
    </div>
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

  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.editable-scene.tiny {
  border: 10px solid #000;
}

.editable-scene.tiny * {
  display: none;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
