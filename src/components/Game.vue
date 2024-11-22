<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { useGameStore, type Action } from '@/stores/game';
import { computed, ref, watch } from 'vue';

const gameStore = useGameStore();
const currentScene = computed(() => gameStore.currentScene);

const textLines = ref<string[]>([]);
const currentLine = ref<number>(0);
const currentChar = ref<number>(0);
const showActions = ref<boolean>(false);

const CHARACTER_DELAY = 100;

const nextCharacter = () => {
    currentChar.value++;
    if (currentChar.value >= textLines.value[currentLine.value].length) {
        if (currentLine.value >= textLines.value.length - 1) {
            showActions.value = true;
        }
        return
    }
    setTimeout(() => {
        nextCharacter();
    }, CHARACTER_DELAY);
}

const startShowingText = (text: string) => {
    const splitChars = ['\\.', '\\?', '!']; // Escape special characters like '.' for RegExp
    textLines.value = text
        .split(new RegExp(`(${splitChars.join('|')})`)) // Use capturing group to include split chars
        .reduce((acc: string[], curr, index) => {
            // Combine the split char with the preceding text
            if (index % 2 === 0) {
                acc.push(curr);
            } else {
                acc[acc.length - 1] += curr;
            }
            return acc;
        }, [])
        .filter((line) => line.trim() !== '');
    currentLine.value = 0;
    currentChar.value = 0;
    nextCharacter();
}

// Start showing the text when the scene changes
watch(currentScene, (scene, oldScene) => {
    if (scene!.id && scene!.id !== oldScene?.id) {
        startShowingText(scene!.text);
    }
});

const textToShow = computed(() => {
    if (currentLine.value >= textLines.value.length) {
        return '';
    }
    return textLines.value[currentLine.value].substring(0, currentChar.value);
});

const nextLine = () => {
    if (currentChar.value < textLines.value[currentLine.value].length) {
        nextCharacter();
        nextCharacter();
        return;
    }
    if (currentLine.value >= textLines.value.length - 1) {
        showActions.value = true;
        return;
    }
    currentLine.value++;
    currentChar.value = 0;
    nextCharacter();
}

const selectAction = (action: Action) => {
    gameStore.performAction(action);
    showActions.value = false;
}

</script>

<template>
    <header>
    </header>

    <main v-if="currentScene" id="app-main" @click="nextLine">
        <p>{{ currentScene.title }}</p>
        <h2>{{ textToShow }}</h2>
        <div v-if="showActions" class="actions">
            <button v-for="(action, index) in currentScene.actions" :key="index" @click="selectAction(action)">{{
                action.title }}</button>
        </div>
    </main>
</template>

<style>
#app-main {
    user-select: none;
}
</style>
