import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useJsonSaver } from '@/composables/useJsonSaver';
import { usePanzoomStore } from './panzoom';


// Create type SceneId which is a string
export type SceneId = string & { __brand: 'SceneId' };
export type GameProgressionSlug = string & { __brand: 'GameProgressionSlug' };

// The game state is just a list of slugs which have happened in the game
export type GameStateList = GameProgressionSlug[]


export interface Action {
  title: string
  description?: string
  gameProgression?: GameProgressionSlug
  nextScene: SceneId | undefined
}


export interface Scene {
  id: SceneId
  title: string
  text: string
  actions: Action[]
  evolutions: {
    // When game state contains the key, the scene will redirect to the value
    [key: GameProgressionSlug]: SceneId
  }
}


export interface GameData {
  title?: string
  version?: string
  description?: string
  initialScene?: SceneId,
  scenes: {
    [key: SceneId]: Scene
  },
  gameProgressions?: GameProgressionSlug[]
}

export const useGameStore = defineStore('game', () => {
  const state = ref<GameData>({
    scenes: {},
  });
  const jsonSaver = useJsonSaver();
  jsonSaver.loadJsonFromDisk('game.json').then((jsonFromDisk) => {
    console.log('jsonFromDisk', jsonFromDisk)
    if (jsonFromDisk) {
      console.log('setting jsonFromDisk', jsonFromDisk)
      state.value = jsonFromDisk
    }
    console.log('state', state.value.scenes);
    const panzoomStore = usePanzoomStore();
    setTimeout(() => {
      panzoomStore.setGameDataLoaded();
      watchForChanges();
    }, 10);
  });

  const currentSceneId = ref<SceneId | undefined>(undefined)
  const gameProgression = ref<GameStateList>([])
  const currentScene = computed(() => currentSceneId.value ? state.value.scenes[currentSceneId.value] : undefined)

  // Load game state from local storage
  const loadGameState = () => {
    const state = localStorage.getItem('game-state')
    if (state) {
      gameProgression.value = JSON.parse(state)
    }
    const state2 = localStorage.getItem('current-scene') as SceneId | null
    if (state2) {
      currentSceneId.value = state2
    }
  }
  loadGameState();

  // Load the game data from a JSON file
  const loadGameData = async (url: string) => {
    const response = await fetch(url)
    state.value = await response.json()
    if (!currentSceneId.value) {
      currentSceneId.value = state.value.initialScene
    }
  }

  // Save game state to local storage
  const saveGameState = () => {
    localStorage.setItem('game-state', JSON.stringify(gameProgression.value))
    localStorage.setItem('current-scene', currentSceneId.value || '')
  }

  // Reset the game state
  const resetGameState = () => {
    gameProgression.value = []
    currentSceneId.value = state.value.initialScene
  }

  // Go to a scene by its ID
  const getSceneById = (sceneId: SceneId | undefined) => {
    if (!sceneId || !state.value.scenes[sceneId]) {
      return undefined
    }
    const newScene = state.value.scenes[sceneId]
    // Check if the scene has an evolution based on the game state
    if (newScene.evolutions) {
      for (const key of gameProgression.value) {
        if (newScene.evolutions[key]) {
          return getSceneById(newScene.evolutions[key])
        }
      }
    }
    return newScene
  }

  const goToScene = (sceneId: SceneId) => {
    currentSceneId.value = getSceneById(sceneId)?.id
    saveGameState()
  }

  const performAction = (action: Action) => {
    if (action.gameProgression) {
      gameProgression.value.push(action.gameProgression)
    }
    if (!action.nextScene) {
      alert('Action does not have a next scene')
      throw new Error('Action does not have a next scene')
    }
    goToScene(action.nextScene)
  }

  const getSceneChildren = (scene: Scene, handledSceneIds?: Set<SceneId>): Scene[] => {
    // Find all scenes that are accessible from the current scene, recursively
    const children = scene.actions.map(action => action.nextScene)
    // Children is an array of scene IDs
    handledSceneIds = handledSceneIds || new Set()
    return children.flatMap(childId => {
      handledSceneIds!.add(childId as SceneId)
      const child = getSceneById(childId)
      if (handledSceneIds.has(childId as SceneId)) {
        if (child) {
          return [child]
        }
      }
      if (child) {
        return [child, ...getSceneChildren(child, handledSceneIds)]
      }
      return [];
    })
  }

  const allCurrentScenes = computed(() => {
    const ret: Scene[] = [];
    // Add all scenes that are not connected to any scene
    const allSceneIds = new Set(Object.keys(state.value.scenes).map(id => id as SceneId))
    for (const scene of Object.values(state.value.scenes)) {
      for (const action of scene.actions.filter(action => !!action.nextScene)) {
        allSceneIds.delete(action.nextScene as SceneId)
      }
    }
    ret.push(...Array.from(allSceneIds).map(id => state.value.scenes[id]))
    // Find all scenes that are accessible with the current game state
    const currentScene = getSceneById(currentSceneId.value || state.value.initialScene)
    if (!currentScene) {
      return ret;
    }
    return [currentScene, ...ret, ...getSceneChildren(currentScene)]
  });

  const createRandomSceneId = () => {
    while (true) {
      const id = Math.random().toString(36).substr(2, 9) as SceneId
      if (!state.value.scenes[id]) {
        return id
      }
    }
  }

  const createScene = () => {
    const newScene: Scene = {
      id: createRandomSceneId(),
      title: 'New Scene',
      text: '',
      actions: [],
      evolutions: {}
    }
    state.value.scenes[newScene.id] = newScene
    if (!currentSceneId.value) {
      currentSceneId.value = newScene.id
    }
    return newScene
  }

  const deleteScene = (sceneId: SceneId) => {
    delete state.value.scenes[sceneId]
    for (const otherScene of Object.values(state.value.scenes)) {
      for (const action of otherScene.actions) {
        if (action.nextScene === sceneId) {
          action.nextScene = undefined
        }
      }
      for (const key of Object.keys(otherScene.evolutions)) {
        if (otherScene.evolutions[key as GameProgressionSlug] === sceneId) {
          delete otherScene.evolutions[key as GameProgressionSlug]
        }
      }
    }
  }

  const setSceneValue = (sceneId: SceneId, key: 'title' | 'text', value: string) => {
    const scene = state.value.scenes[sceneId]
    scene[key] = value
  }

  const createAction = (sceneId: SceneId) => {
    const newAction: Action = {
      title: 'New Action',
      nextScene: undefined,
    }
    const scene = state.value.scenes[sceneId]
    scene.actions.push(newAction)
    return newAction
  }

  const deleteAction = (sceneId: SceneId, action: Action) => {
    const scene = state.value.scenes[sceneId]
    const index = scene.actions.indexOf(action)
    scene.actions.splice(index, 1)
  }

  const setActions = (scene: Scene, actions: Action[]) => {
    scene.actions = actions
  }

  const joinActionToScene = (action: Action, nextSceneId: SceneId) => {
    action.nextScene = nextSceneId
  }

  const setActionValue = (action: Action, key: 'gameProgression' | 'title' | 'description', value: unknown) => {
    action[key] = value as string & { __brand: 'GameProgressionSlug' }
  }

  const disconnectAction = (action: Action) => {
    action.nextScene = undefined
  }

  const watchForChanges = () => {
    watch(state, () => {
      jsonSaver.saveJsonToDisk(state.value, 'game.json')
    }, { deep: true })
  }

  return {
    state,
    currentSceneId,
    gameProgression,
    currentScene,
    loadGameState,
    loadGameData,
    saveGameState,
    resetGameState,
    goToScene,
    performAction,
    allCurrentScenes,
    createScene,
    deleteScene,
    setSceneValue,
    createAction,
    deleteAction,
    setActions,
    joinActionToScene,
    setActionValue,
    disconnectAction,
  }
});
