<script setup lang="ts">
import { ref } from 'vue';
import Game from './Game.vue';

// Find possible games

const gameChoices = ref<string[]>([]);
fetch(`gamelist.json`).then(async (response) => {
    const games = await response.json();
    gameChoices.value = games;
});

const chosenGame = ref<string>('');

function chooseGame(game: string) {
    chosenGame.value = game;
    // Add query param game=game
    const url = new URL(window.location.href);
    url.searchParams.set('game', game);
    window.history.pushState({}, '', url.toString());
}

</script>

<template>
    <header>
    </header>

    <main v-if="!chosenGame" id="app-main">
        <h1>Valitse peli</h1>
        <ul>
            <li v-for="game in gameChoices" :key="game">
                <button @click="chooseGame(game)">{{ game }}</button>
            </li>
        </ul>
    </main>
    <Game v-else />
</template>

<style scoped>
#app-main {
    user-select: none;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: flex-start;
}
</style>
