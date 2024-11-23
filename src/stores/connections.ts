import { defineStore } from "pinia"
import { ref } from "vue"
import { useGameStore, type SceneId } from "./game"
import { useEditorStore } from "./editor"
import { usePanzoomStore } from "./panzoom"

export type ConnectionId = string & { __brand: 'ConnectionId' }


export interface Connection {
    id: ConnectionId
    toSceneId?: SceneId
    fromX: number
    fromY: number
    toX?: number
    toY?: number
}


export interface ConnectionsState {
    connections: {
        [key: ConnectionId]: Connection
    },
    connectionInProgress?: ConnectionId
    mousePosition: {
        x: number | undefined
        y: number | undefined
    }
}

export const useConnectionStore = defineStore('connections', () => {
    const state = ref<ConnectionsState>({
        connections: {},
        mousePosition: {
            x: 0,
            y: 0
        }
    })
    const editorStore = useEditorStore()
    const gameStore = useGameStore()

    const addConnection = (sceneId: SceneId, actionIndex: number) => {
        // Delete it
        if (state.value.connectionInProgress) {
            deleteConnection(state.value.connectionInProgress)
        }
        const connectionId = `connection-${sceneId}-${actionIndex}` as ConnectionId
        const scene = editorStore.state.scenes[sceneId]
        const actionX = editorStore.state.scenes[sceneId].x + scene.actionPositions![actionIndex].x
        const actionY = editorStore.state.scenes[sceneId].y + scene.actionPositions![actionIndex].y
        state.value.connections[connectionId] = {
            id: connectionId,
            fromX: actionX,
            fromY: actionY,
        }
        state.value.connectionInProgress = connectionId
        console.log('Added connection', connectionId, state.value.connections[connectionId]);
    }

    const deleteConnection = (connectionId: ConnectionId) => {
        delete state.value.connections[connectionId]
    }

    const setMousePosition = ({ x, y }: { x: number | undefined, y: number | undefined }) => {
        state.value.mousePosition = { x, y }
    }

    const finishConnection = (sceneId: SceneId) => {
        // Find the connection that has no toX
        if (!state.value.connectionInProgress) {
            return;
        }
        const connectionId = state.value.connectionInProgress
        // Don't connect to the same scene
        const fromSceneId = state.value.connectionInProgress.split('-')[1] as SceneId
        if (fromSceneId === sceneId) {
            return
        }
        const connection = state.value.connections[state.value.connectionInProgress]
        // Set the connection's toX and toY
        const sceneX = editorStore.state.scenes[sceneId].x
        const sceneY = editorStore.state.scenes[sceneId].y
        connection.toX = sceneX + 250
        connection.toY = sceneY + 250
        connection.toSceneId = sceneId
        console.log('Finished connection', connection.id, connection);

        const scene = gameStore.state.scenes[fromSceneId]
        const action = scene.actions[parseInt(state.value.connectionInProgress.split('-')[2])]
        gameStore.joinActionToScene(action, sceneId)

        state.value.connectionInProgress = undefined;
        return {
            fromSceneId,
            actionIndex: parseInt(connectionId.split('-')[2]),
            toSceneId: sceneId
        }
    }

    const setSceneCoordinates = (sceneId: SceneId, x: number, y: number) => {
        // Find the connection start from sceneId
        for (const key in state.value.connections) {
            if (key.startsWith(`connection-${sceneId}`)) {
                const actionIndex = parseInt(key.split('-')[2])
                const scene = editorStore.state.scenes[sceneId]
                const connection = state.value.connections[key as ConnectionId]
                connection.fromX = x + scene.actionPositions![actionIndex].x
                connection.fromY = y + scene.actionPositions![actionIndex].y
            }
        }

        // Find the connection end to sceneId
        for (const key in state.value.connections) {
            if (state.value.connections[key as ConnectionId].toSceneId === sceneId) {
                const connection = state.value.connections[key as ConnectionId]
                connection.toX = x + 250
                connection.toY = y + 250
            }
        }
    }

    const redrawAllConnections = () => {
        // Draw all connections using the editorStore's scene positions
        // And visible scenes from gameStore
        // Delete all connections
        for (const key in state.value.connections) {
            delete state.value.connections[key as ConnectionId]
        }
        for (const scene of gameStore.allCurrentScenes) {
            for (const actionIndex in scene.actions) {
                const action = scene.actions[actionIndex]
                if (action.nextScene) {
                    const connectionId = `connection-${scene.id}-${actionIndex}` as ConnectionId
                    const fromScene = editorStore.state.scenes[scene.id]
                    const toScene = editorStore.state.scenes[action.nextScene]
                    if (!fromScene || !fromScene.actionPositions![parseInt(actionIndex)]) {
                        continue
                    }
                    state.value.connections[connectionId] = {
                        id: connectionId,
                        fromX: fromScene.x + fromScene.actionPositions![parseInt(actionIndex)].x,
                        fromY: fromScene.y + fromScene.actionPositions![parseInt(actionIndex)].y,
                        toX: toScene.x + 250,
                        toY: toScene.y + 250,
                        toSceneId: action.nextScene,
                    }
                }
            }
        }
    }

    const panzoomStore = usePanzoomStore();
    panzoomStore.allDataLoaded.then(() => {
        // Draw all connections
        redrawAllConnections();
    });

    const cancelConnection = () => {
        if (state.value.connectionInProgress) {
            deleteConnection(state.value.connectionInProgress)
            state.value.connectionInProgress = undefined
        }
    }

    return {
        state,
        addConnection,
        deleteConnection,
        setMousePosition,
        finishConnection,
        setSceneCoordinates,
        cancelConnection,
        redrawAllConnections,
    }
});
