<script setup lang="ts">

import { useConnectionStore } from '@/stores/connections';
import { useGameStore, type Action, type SceneId } from '@/stores/game';
import { defineProps, onMounted, ref, useTemplateRef } from 'vue';

const props = defineProps<{
    sceneId: SceneId
    action: Action
    actionIndex: number
}>();

const editingElement = ref<HTMLElement | null>(null);
const gameStore = useGameStore();
const title = useTemplateRef('title');
const gameProgression = useTemplateRef('gameProgression');

const setTitle = () => {
    if (!title.value) {
        return;
    }
    if (title.value.innerText.trim() === '') {
        // Delete action if title is empty
        console.log('Deleting action', props.action);
        gameStore.deleteAction(props.sceneId, props.action);
        return;
    }
    gameStore.setActionValue(props.action, 'title', title.value.innerText.trim());
};

const setGameProgression = () => {
    if (!gameProgression.value) {
        return;
    }
    gameStore.setActionValue(props.action, 'gameProgression', gameProgression.value.innerText.trim());
};

const setEditingElement = (element: string) => {
    if (element === 'title') {
        editingElement.value = title.value;
    }
    if (element === 'gameProgression') {
        editingElement.value = gameProgression.value;
    }
};

const connectionStore = useConnectionStore();

const startConnecting = () => {
    console.log('Start connecting');
    connectionStore.addConnection(props.sceneId, props.actionIndex);
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
    <div class="editable-action">
        <h1 ref="title" class="not-draggable title-edit" contenteditable spellcheck="false"
            @mousedown="setEditingElement('title')" @blur="setTitle">{{
                action.title }}</h1>
        <div class="extra">
            <div ref="connector" class="connector" @click="startConnecting">
                #
            </div>
            <h1 ref="gameProgression" class="not-draggable gameProgression-edit" contenteditable spellcheck="false"
                @mousedown="setEditingElement('gameProgression')" @blur="setGameProgression">{{
                    action.gameProgression }}</h1>
        </div>
    </div>
</template>

<style>
.title-edit {
    min-width: 5px;
}

.editable-action {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: fit-content;
    height: 100px;
    background-color: #f0f0f0;
    border-radius: 10px;
    padding: 10px;
    margin: 10px;
}

.editable-action h1 {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0;
    padding: 0;
}

.connector {
    cursor: pointer;
}

.extra {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

h1[contenteditable] {
    border: 1px solid #ccc;
    min-width: 20px;
}
</style>