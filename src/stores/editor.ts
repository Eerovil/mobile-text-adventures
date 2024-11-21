import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SceneId } from './game'


export type TextBoxId = string & { __brand: 'TextBoxId' }


export interface EditorDraggableElement {
    x: number
    y: number
    width?: number
    height?: number
}


export interface EditorTextBox extends EditorDraggableElement {
    id: TextBoxId
    text: string
}

export interface EditorSceneState extends EditorDraggableElement {
    id: SceneId
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


import type { Scene } from './game';
export interface SceneWithMeta extends Scene, EditorSceneState {}


export const useEditorStore = defineStore('editor', () => {
    const state = ref<EditorState>({
        scenes: {},
        textboxes: {},
        zoom: 1,
    })

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
