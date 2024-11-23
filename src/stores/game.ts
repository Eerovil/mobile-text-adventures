import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { useJsonSaver } from '@/composables/useJsonSaver';
import { usePanzoomStore } from './panzoom';
import { useConnectionStore } from './connections';
import { useEditorStore } from './editor';


// Create type SceneId which is a string
export type SceneId = string & { __brand: 'SceneId' };
export type GameProgressionSlug = string & { __brand: 'GameProgressionSlug' };

// The game state is just a list of slugs which have happened in the game
export type GameStateList = GameProgressionSlug[]


export interface GameState {
  progressions: GameProgressionSlug[]
  visitedScenes: SceneId[]
  currentScene?: SceneId
}


export interface Action {
  title: string
  description?: string
  gameProgression?: GameProgressionSlug
  nextScene: SceneId | undefined
}


export interface Scene {
  id: SceneId
  ogId?: SceneId
  title: string
  text: string
  text2?: string
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
}

export const useGameStore = defineStore('game', () => {
  const state = ref<GameData>({
    scenes: {},
  });
  const gameState = ref<GameState>({
    progressions: [],
    visitedScenes: [],
    currentScene: undefined,
  });
  const connectionStore = useConnectionStore();
  const gameName = new URLSearchParams(window.location.search).get('game')
  const fileName = gameName ? `${gameName}-game.json` : 'game.json'
  const jsonSaver = useJsonSaver();
  jsonSaver.loadJsonFromDisk(fileName).then((jsonFromDisk) => {
    console.log('jsonFromDisk', jsonFromDisk)
    if (jsonFromDisk) {
      console.log('setting jsonFromDisk', jsonFromDisk)
      state.value = jsonFromDisk
      if (!gameState.value.currentScene) {
        gameState.value.currentScene = state.value.initialScene
      }
    }
    console.log('state', state.value.scenes);
    const panzoomStore = usePanzoomStore();
    setTimeout(() => {
      panzoomStore.setGameDataLoaded();
      watchForChanges();
    }, 10);
  });

  const currentScene = computed(() => {
    if (!gameState.value.currentScene) {
      return undefined
    }
    const scene = { ...state.value.scenes[gameState.value.currentScene] }
    // If already visited, set text to text2 (if it is defined)
    if (gameState.value.visitedScenes.includes(gameState.value.currentScene)) {
      if (scene.text2) {
        scene.text = scene.text2
      }
    }
    return scene
  });

  // Reset the game state
  const resetGameState = () => {
    gameState.value = {
      progressions: [],
      visitedScenes: [],
      currentScene: state.value.initialScene
    }
  }

  // Load game state from local storage
  const loadGameState = () => {
    const state = localStorage.getItem('game-state')
    if (state) {
      // If state is incorrect, reset it
      if (typeof JSON.parse(state) !== 'object') {
        resetGameState()
        return
      }
      // If state has not correct keys, reset it
      const keys = Object.keys(JSON.parse(state))
      if (!keys.includes('progressions') || !keys.includes('visitedScenes') || !keys.includes('currentScene')) {
        resetGameState()
        return
      }
      gameState.value = JSON.parse(state)
    }
  }
  // loadGameState();

  // Save game state to local storage
  const saveGameState = () => {
    localStorage.setItem('game-state', JSON.stringify(gameState.value))
  }

  watch(gameState, () => {
    saveGameState()
  }, { deep: true })

  // Go to a scene by its ID
  const getSceneById = (sceneId: SceneId | undefined) => {
    if (!sceneId || !state.value.scenes[sceneId]) {
      return undefined
    }
    const newScene = state.value.scenes[sceneId]
    // Check if the scene has an evolution based on the game state
    if (newScene.evolutions) {
      for (const key of gameState.value.progressions) {
        if (newScene.evolutions[key]) {
          return getSceneById(newScene.evolutions[key])
        }
      }
    }
    return newScene
  }

  const goToScene = (sceneId: SceneId) => {
    const prevScene = gameState.value.currentScene
    gameState.value.currentScene = getSceneById(sceneId)?.id
    if (prevScene && !gameState.value.visitedScenes.includes(prevScene)) {
      console.log('pushing prevScene', prevScene)
      gameState.value.visitedScenes.push(prevScene)
    }
    saveGameState()
  }

  const performAction = (action: Action) => {
    if (action.gameProgression) {
      gameState.value.progressions.push(action.gameProgression)
    }
    if (!action.nextScene) {
      alert('Action does not have a next scene')
      throw new Error('Action does not have a next scene')
    }
    goToScene(action.nextScene)
  }

  const allCurrentScenes = computed(() => {
    const progressionRequiredForScene: Record<SceneId, GameProgressionSlug> = {}
    for (const scene of Object.values(state.value.scenes)) {
      for (const progressionStr in scene.evolutions) {
        const progression = progressionStr as GameProgressionSlug
        progressionRequiredForScene[scene.evolutions[progression] as SceneId] = progression
      }
    }
    const ret: Record<SceneId, Scene> = {}
    for (const sceneId of Object.keys(state.value.scenes)) {
      const scene = getSceneById(sceneId as SceneId)
      if (scene) {
        if (progressionRequiredForScene[scene.id]) {
          if (!gameState.value.progressions.includes(progressionRequiredForScene[scene.id])) {
            continue
          }
        }
        ret[scene.id] = scene
      }
    }
    return Object.values(ret)
  });

  const createRandomSceneId = () => {
    while (true) {
      const id = Math.random().toString(36).substr(2, 9) as SceneId
      if (!state.value.scenes[id]) {
        return id
      }
    }
  }

  const createScene = (): Scene => {
    const newScene: Scene = {
      id: createRandomSceneId(),
      title: '',
      text: '',
      actions: [],
      evolutions: {}
    }
    state.value.scenes[newScene.id] = newScene
    if (!gameState.value.currentScene) {
      gameState.value.currentScene = newScene.id
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
    connectionStore.redrawAllConnections()
  }

  const setSceneValue = (sceneId: SceneId, key: 'title' | 'text' | 'text2', value: string) => {
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
      jsonSaver.saveJsonToDisk(state.value, fileName)
    }, { deep: true })
  }

  const allProgressions = computed(() => {
    const progressions = new Set<GameProgressionSlug>()
    for (const scene of Object.values(state.value.scenes)) {
      for (const action of scene.actions) {
        if (action.gameProgression) {
          progressions.add(action.gameProgression)
        }
      }
    }
    return Array.from(progressions)
  });

  const addProgression = (progression: GameProgressionSlug) => {
    console.log('addProgression', progression)
    if (!gameState.value.progressions) {
      gameState.value.progressions = []
    }
    if (!gameState.value.progressions.includes(progression)) {
      gameState.value.progressions.push(progression)
      // Set current scene to the nextScene of the action that causes the progression
      for (const scene of Object.values(state.value.scenes)) {
        for (const action of scene.actions) {
          if (action.gameProgression === progression) {
            if (action.nextScene) {
              gameState.value.currentScene = action.nextScene
              return
            }
          }
        }
      }
    }
  }

  const removeProgression = (progression: GameProgressionSlug) => {
    if (!gameState.value.progressions) {
      return
    }
    const index = gameState.value.progressions.indexOf(progression)
    if (index !== -1) {
      gameState.value.progressions.splice(index, 1)
    }
  }

  const editorStore = useEditorStore();

  const createEvolution = (sceneId: SceneId, progression: GameProgressionSlug) => {
    // Create a new scene with the same text and actions
    // Add the new scene to the evolutions of the given
    // scene with the given progression
    const scene = state.value.scenes[sceneId]
    const newScene: Scene = {
      id: createRandomSceneId(),
      title: scene.title,
      text: scene.text,
      text2: scene.text2,
      actions: scene.actions,
      evolutions: {}
    }
    state.value.scenes[newScene.id] = newScene
    scene.evolutions[progression] = newScene.id
    editorStore.createEvolution(sceneId, newScene.id);
    return newScene
  }

  return {
    state,
    gameState,
    currentSceneId: computed(() => gameState.value.currentScene),
    gameProgression: computed(() => gameState.value.progressions),
    currentScene,
    loadGameState,
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
    allProgressions,
    addProgression,
    removeProgression,
    createEvolution,
    setInitialScene: (sceneId: SceneId) => { state.value.initialScene = sceneId }
  }
});
