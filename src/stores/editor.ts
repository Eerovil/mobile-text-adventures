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

export interface EditorState {
    scenes: {
        [key: SceneId]: EditorDraggableElement
    },
    textboxes: {
        [key: SceneId]: EditorTextBox
    }
    zoom: number
}


import type { Scene } from './game';
import { useJsonSaver } from '@/composables/useJsonSaver'
import { usePanzoomStore } from './panzoom'
export interface SceneWithMeta extends Scene, EditorDraggableElement { }


export const useEditorStore = defineStore('editor', () => {
    const state = ref<EditorState>({
        scenes: {},
        textboxes: {},
        zoom: 1,
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

    const moveDraggableElement = (id: SceneId, x: number, y: number) => {
        const correctObj = state.value.scenes[id] || state.value.textboxes[id];
        if (!correctObj) {
            return
        }
        correctObj.x = x
        correctObj.y = y
    }

    // Watch for changes in the editor state and save to disk
    watch(state, () => {
        console.log('Saving editor state to disk')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { zoom, ...editorState } = state.value
        jsonSaver.saveJsonToDisk(editorState, 'editor-state.json')
    }, { deep: true })

    return {
        state,
        moveScene,
        createTextBox,
        updateTextBox,
        moveDraggableElement,
    }
});
