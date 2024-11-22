<script setup lang="ts">
import { computed, defineProps } from 'vue';
import { useConnectionStore, type Connection } from '@/stores/connections';

const { connection } = defineProps<{
    connection: Connection;
}>();

const connectionStore = useConnectionStore();
const toX = computed(() => {
    return connection.toX || connectionStore.state.mousePosition.x;
});
const toY = computed(() => {
    return connection.toY || connectionStore.state.mousePosition.y;
});

const shorterToCoords = computed(() => {
    const shortenBy = 250;
    if (!toX.value || !toY.value) {
        return null;
    }
    const angle = Math.atan2(toY.value - connection.fromY, toX.value - connection.fromX);
    const x = toX.value - shortenBy * Math.cos(angle);
    const y = toY.value - shortenBy * Math.sin(angle);
    return { x, y };
});

function getArrowPoints(
    toX: number,
    toY: number,
    fromX: number,
    fromY: number,
    arrowLength: number = 50, // Length of the arrowhead
    arrowWidth: number = 15 // Width of the arrowhead
) {
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Calculate the points for the arrowhead
    const leftX = toX - arrowLength * Math.cos(angle - Math.atan(arrowWidth / arrowLength));
    const leftY = toY - arrowLength * Math.sin(angle - Math.atan(arrowWidth / arrowLength));
    const rightX = toX - arrowLength * Math.cos(angle + Math.atan(arrowWidth / arrowLength));
    const rightY = toY - arrowLength * Math.sin(angle + Math.atan(arrowWidth / arrowLength));

    return { leftX, leftY, rightX, rightY };
}

</script>

<template>
    <!-- Straight line -->
    <line v-if="shorterToCoords" :x1="connection.fromX" :y1="connection.fromY" :x2="shorterToCoords.x"
        :y2="shorterToCoords.y" stroke="black" stroke-width="2" />
    <!-- Arrowhead -->
    <polygon v-if="shorterToCoords" :points="`
                ${shorterToCoords.x},
                ${shorterToCoords.y}
                ${getArrowPoints(shorterToCoords.x, shorterToCoords.y, connection.fromX, connection.fromY).leftX},
                ${getArrowPoints(shorterToCoords.x, shorterToCoords.y, connection.fromX, connection.fromY).leftY}
                ${getArrowPoints(shorterToCoords.x, shorterToCoords.y, connection.fromX, connection.fromY).rightX},
                ${getArrowPoints(shorterToCoords.x, shorterToCoords.y, connection.fromX, connection.fromY).rightY}
            `" fill="black" />
</template>

<style scoped lang="css">
line {
    opacity: 0.2;
}

polygon {
    opacity: 0.2;
}
</style>
