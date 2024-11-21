import type { PanzoomObject } from "@panzoom/panzoom";

import { defineStore } from 'pinia'

import { computed, ref } from 'vue'

export interface PanzoomState {
    currentScale: number
    panzoom: PanzoomObject | null
}

export const usePanzoomStore = defineStore('panzoom', () => {
    const state = ref<PanzoomState>({
        currentScale: 1,
        panzoom: null,
    })

    const zoomWithWheel = (event: WheelEvent) => {
        if (state.value.panzoom) {
            state.value.panzoom.zoomWithWheel(event)
        }
        // This is to make sure the zoom is updated in all related components, they will watch the getScale computed
        state.value.currentScale = state.value.panzoom?.getScale() || 1
    }

    const setPanzoom = (panzoom: PanzoomObject) => {
        state.value.panzoom = panzoom
    }

    const getScale = computed(() => state.value.currentScale)

    return {
        state,
        zoomWithWheel,
        getScale,
        setPanzoom,
    }
})