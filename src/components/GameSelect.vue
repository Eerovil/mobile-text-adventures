<script setup lang="ts">
import { ref } from 'vue';
import Game from './Game.vue';

// Find possible games

const gameChoices = ref<string[]>([]);
fetch(`gamelist.json?var=${Math.random()}`).then(async (response) => {
    const games = await response.json();
    gameChoices.value = games;
});

const chosenGame = ref<string>('');
if (window.location.search) {
    const url = new URL(window.location.href);
    const game = url.searchParams.get('game');
    if (game) {
        chosenGame.value = game;
    }
}

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

li {
    list-style-type: none;
    margin-top: 1rem;
}

button {
    font-size: 2rem;
}
</style>
