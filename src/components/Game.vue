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

const setShowActions = (value: boolean) => {
    if (value) {
        setTimeout(() => {
            showActions.value = true;
        }, 500);
    }
}

const nextCharacter = () => {
    currentChar.value++;
    if (currentChar.value >= textLines.value[currentLine.value].length) {
        setTimeout(() => {
            allowNextLine.value = true;
        }, 500);
        if (currentLine.value >= textLines.value.length - 1) {
            setShowActions(true);
        }
        return
    }
    allowNextLine.value = false;
    setTimeout(() => {
        nextCharacter();
    }, CHARACTER_DELAY);
}

const startShowingText = (text: string) => {
    const splitChars = ['\\.', '\\?', '!']; // Escape special characters like '.' for RegExp
    // If the whole text doesn't env with any of splitChars, add a '.' to the end
    if (!['.', '?', '!'].some((char) => (text.trim()).endsWith(char))) {
        text += '.';
    }
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

const allowNextLine = ref<boolean>(false);

const nextLine = () => {
    // If clicking on action, return
    if (showActions.value) {
        return;
    }
    if (currentChar.value < textLines.value[currentLine.value].length) {
        nextCharacter();
        nextCharacter();
        return;
    }
    if (currentLine.value >= textLines.value.length - 1) {
        setShowActions(true);
        return;
    }
    if (!allowNextLine.value) {
        return;
    }
    currentLine.value++;
    currentChar.value = 0;
    nextCharacter();
}

const selectAction = (action: Action) => {
    setTimeout(() => {
        gameStore.performAction(action);
        showActions.value = false;
    }, 10)
}

</script>

<template>
    <header>
    </header>

    <main v-if="currentScene" id="app-main" @click="nextLine">
        <div class="texts">
            <p>{{ currentScene.title || '' }}</p>
            <h2>{{ textToShow }}</h2>
        </div>
        <div v-if="showActions" class="actions">
            <div v-for="(action, index) in currentScene.actions" :key="index" @click="selectAction(action)">{{
                action.title }}</div>
        </div>
        <div v-else-if="allowNextLine">
            <div>...</div>
        </div>
    </main>
</template>

<style scoped>
#app-main {
    user-select: none;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 4rem;
}

.texts {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    width: 90%;
    height: 30%;
}

.texts h2 {
    font-size: 2rem;
}

.actions {
    margin-bottom: 2rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
}

.actions>div {
    margin: 0.5rem;
    padding: 0.5rem;
    background-color: #ffffff;
    color: black;
    cursor: pointer;

    font-size: 2rem;

    border: 1px solid #000;
}
</style>
