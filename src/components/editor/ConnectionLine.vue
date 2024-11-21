<script setup lang="ts">
import { defineProps } from 'vue';
import { useConnectionStore, type Connection } from '@/stores/connections';

const { connection } = defineProps<{
    connection: Connection
}>();

const connectionStore = useConnectionStore();

</script>

<template>
    <line v-if="connection.toX || connectionStore.state.mousePosition.x" :x1="connection.fromX" :y1="connection.fromY"
        :x2="connection.toX || connectionStore.state.mousePosition.x"
        :y2="connection.toY || connectionStore.state.mousePosition.y" stroke="black" stroke-width="2" />
</template>
