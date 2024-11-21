import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { SceneId } from './game'

export interface EditorDraggableElement {
    id: SceneId
    x: number
    y: number
    width?: number
    height?: number
}


export interface EditorTextBox extends EditorDraggableElement {
    text: string
}

interface ActionPosition {
    x: number
    y: number
}

export interface EditorScene extends EditorDraggableElement {
    actionPositions?: ActionPosition[]
}

export interface EditorState {
    scenes: {
        [key: SceneId]: EditorScene
    },
    textboxes: {
        [key: SceneId]: EditorTextBox
    }
}


import type { Scene } from './game';
import { useJsonSaver } from '@/composables/useJsonSaver'
import { usePanzoomStore } from './panzoom'
import { useConnectionStore } from './connections'
export interface SceneWithMeta extends Scene, EditorDraggableElement { }


export const useEditorStore = defineStore('editor', () => {
    const state = ref<EditorState>({
        scenes: {},
        textboxes: {},
    });
    const jsonSaver = useJsonSaver();
    jsonSaver.loadJsonFromDisk('editor-state.json').then((jsonFromDisk) => {
        console.log('jsonFromDisk', jsonFromDisk)
        if (jsonFromDisk) {
            state.value = jsonFromDisk
        }
        const panzoomStore = usePanzoomStore();
        setTimeout(() => {
            panzoomStore.setEditorDataLoaded();
            watchForChanges();
        }, 10);
    });

    const moveScene = (sceneId: SceneId, x: number, y: number) => {
        if (!state.value.scenes[sceneId]) {
            state.value.scenes[sceneId] = {
                id: sceneId,
                x,
                y,
            }
            return
        }
        state.value.scenes[sceneId].x = x
        state.value.scenes[sceneId].y = y
    }

    const createTextBox = (x: number, y: number) => {
        while (true) {
            const id = Math.random().toString(36).substring(7) as SceneId
            if (!state.value.textboxes[id]) {
                state.value.textboxes[id] = {
                    id,
                    text: '',
                    x,
                    y,

                }
                return id
            }
        }
    }

    const updateTextBox = (id: SceneId, text: string) => {
        state.value.textboxes[id].text = text
    }

    const connectionStore = useConnectionStore();

    const moveDraggableElement = (id: SceneId, x: number, y: number) => {
        const correctObj = state.value.scenes[id] || state.value.textboxes[id];
        if (!correctObj) {
            return
        }
        correctObj.x = x
        correctObj.y = y
        connectionStore.setSceneCoordinates(id, x, y);
    }

    const watchForChanges = () => {
        // Watch for changes in the editor state and save to disk
        watch(state, () => {
            console.log('Saving editor state to disk')
            // Send update to connectionStore
            jsonSaver.saveJsonToDisk(state.value, 'editor-state.json')
        }, { deep: true })
    }

    const setActionPositions = (sceneId: SceneId, actionPositions: ActionPosition[]) => {
        if (!state.value.scenes[sceneId]) {
            return
        }
        state.value.scenes[sceneId].actionPositions = actionPositions
    }

    return {
        state,
        moveScene,
        createTextBox,
        updateTextBox,
        moveDraggableElement,
        setActionPositions,
    }
});
