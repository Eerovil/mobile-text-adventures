import { ref, computed } from 'vue'
import { defineStore } from 'pinia'


export type SceneId = string
export type GameStateSlug = string

// The game state is just a list of slugs which have happened in the game
export type GameStateList = GameStateSlug[]


export interface Action {
  title: string
  description?: string
  gameProgression?: GameStateSlug
  nextScene: SceneId
}


export interface Scene {
  id: SceneId
  title: string
  description?: string
  background: string
  actions: [Action]
  evolutions: {
    // When game state contains the key, the scene will redirect to the value
    [key: GameStateSlug]: SceneId
  }
}


export interface GameData {
  title?: string
  version?: string
  description?: string
  initialScene: SceneId,
  scenes: {
    [key: SceneId]: Scene
  }
}

export const useGameStore = defineStore('game', () => {
  const gameData = ref<GameData>({
    scenes: {},
    initialScene: ''
  })

  const currentSceneId = ref<SceneId>('')
  const gameState = ref<GameStateList>([])
  const currentScene = computed(() => gameData.value.scenes[currentSceneId.value])

  // Load game state from local storage
  const loadGameState = () => {
    const state = localStorage.getItem('game-state')
    if (state) {
      gameState.value = JSON.parse(state)
    }
    const state2 = localStorage.getItem('current-scene')
    if (state2) {
      currentSceneId.value = state2
    }
  }

  // Load the game data from a JSON file
  const loadGameData = async (url: string) => {
    const response = await fetch(url)
    gameData.value = await response.json()
    if (!currentSceneId.value) {
      currentSceneId.value = gameData.value.initialScene
    }
  }

  // Save game state to local storage
  const saveGameState = () => {
    localStorage.setItem('game-state', JSON.stringify(gameState.value))
    localStorage.setItem('current-scene', currentSceneId.value)
  }

  // Reset the game state
  const resetGameState = () => {
    gameState.value = []
    currentSceneId.value = gameData.value.initialScene
  }

  // Go to a scene by its ID
  const getSceneById = (sceneId: SceneId) => {
    const newScene = gameData.value.scenes[sceneId]
    // Check if the scene has an evolution based on the game state
    if (newScene.evolutions) {
      for (const key of gameState.value) {
        if (newScene.evolutions[key]) {
          return getSceneById(newScene.evolutions[key])
        }
      }
    }
    return newScene
  }

  const goToScene = (sceneId: SceneId) => {
    currentSceneId.value = getSceneById(sceneId).id
    saveGameState()
  }

  const performAction = (action: Action) => {
    if (action.gameProgression) {
      gameState.value.push(action.gameProgression)
    }
    goToScene(action.nextScene)
  }

  const getAllGameStates = () => {
    // Find all actions that have a gameProgression
    const actions = Object.values(gameData.value.scenes).flatMap(scene => scene.actions)
    return actions.map(action => action.gameProgression).filter(Boolean)
  }

  const getSceneChildren = (scene: Scene): Scene[] => {
    // Find all scenes that are accessible from the current scene, recursively
    const children = scene.actions.map(action => action.nextScene)
    // Children is an array of scene IDs
    return children.flatMap(childId => {
      const child = getSceneById(childId)
      return [child, ...getSceneChildren(child)]
    })
  }

  const getAllCurrentScenes = () => {
    // Find all scenes that are accessible with the current game state
    const currentScene = getSceneById(currentSceneId.value || gameData.value.initialScene)
    return [currentScene, ...getSceneChildren(currentScene)]
  }

  return {
    gameData,
    currentSceneId,
    gameState,
    currentScene,
    loadGameState,
    loadGameData,
    saveGameState,
    resetGameState,
    goToScene,
    performAction,
    getAllGameStates,
    getAllCurrentScenes,
  }
})
