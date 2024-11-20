import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SceneId } from './game'


export type TextBoxId = string & { __brand: 'TextBoxId' }

export interface EditorTextBox {
    id: TextBoxId
    text: string
    x: number
    y: number
}

export interface EditorSceneState {
    id: SceneId
    x: number
    y: number
}

export interface EditorState {
    scenes: {
        [key: SceneId]: EditorSceneState
    },
    textboxes: {
        [key: TextBoxId]: EditorTextBox
    }
    zoom: number
}

export const useEditorStore = defineStore('editor', () => {
    const state = ref<EditorState>({
        scenes: {},
        textboxes: {},
        zoom: 1,
    })

    const moveScene = (sceneId: SceneId, x: number, y: number) => {
        state.value.scenes[sceneId].x = x
        state.value.scenes[sceneId].y = y
    }

    const createTextBox = (x: number, y: number) => {
        while (true) {
            const id = Math.random().toString(36).substring(7) as TextBoxId
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

    const updateTextBox = (id: TextBoxId, text: string) => {
        state.value.textboxes[id].text = text
    }

    const moveTextBox = (id: TextBoxId, x: number, y: number) => {
        state.value.textboxes[id].x = x
        state.value.textboxes[id].y = y
    }

    return {
        state,
        moveScene,
        createTextBox,
        updateTextBox,
        moveTextBox,
    }
});
