import { ref, computed } from 'vue'
import { defineStore } from 'pinia'


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
  description?: string
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
  })

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
    if (!sceneId) {
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

  const getSceneChildren = (scene: Scene): Scene[] => {
    // Find all scenes that are accessible from the current scene, recursively
    const children = scene.actions.map(action => action.nextScene)
    // Children is an array of scene IDs
    return children.flatMap(childId => {
      const child = getSceneById(childId)
      if (child) {
        return [child, ...getSceneChildren(child)]
      }
      return [];
    })
  }

  const allCurrentScenes = computed(() => {
    // Find all scenes that are accessible with the current game state
    const currentScene = getSceneById(currentSceneId.value || state.value.initialScene)
    if (!currentScene) {
      return []
    }
    return [currentScene, ...getSceneChildren(currentScene)]
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
      actions: [],
      evolutions: {}
    }
    state.value.scenes[newScene.id] = newScene
    return newScene
  }

  const deleteScene = (scene: Scene) => {
    delete state.value.scenes[scene.id]
    for (const otherScene of Object.values(state.value.scenes)) {
      for (const action of otherScene.actions) {
        if (action.nextScene === scene.id) {
          action.nextScene = undefined
        }
      }
      for (const key of Object.keys(otherScene.evolutions)) {
        if (otherScene.evolutions[key as GameProgressionSlug] === scene.id) {
          delete otherScene.evolutions[key as GameProgressionSlug]
        }
      }
    }
  }

  const setSceneValue = (scene: Scene, key: 'title' | 'description', value: string) => {
    scene[key] = value
  }

  const createAction = (scene: Scene) => {
    const newAction: Action = {
      title: 'New Action',
      nextScene: undefined,
    }
    scene.actions.push(newAction)
    return newAction
  }

  const deleteAction = (scene: Scene, action: Action) => {
    const index = scene.actions.indexOf(action)
    scene.actions.splice(index, 1)
  }

  const setActions = (scene: Scene, actions: Action[]) => {
    scene.actions = actions
  }

  const joinActionToScene = (action: Action, nextScene: Scene) => {
    action.nextScene = nextScene.id
  }

  const setActionValue = (action: Action, key: 'gameProgression' | 'title' | 'description', value: unknown) => {
    action[key] = value as string & { __brand: 'GameProgressionSlug' }
  }

  const disconnectAction = (action: Action) => {
    action.nextScene = undefined
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
