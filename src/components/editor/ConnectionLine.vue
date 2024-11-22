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
    <svg>
        <!-- Straight line -->
        <line v-if="toX && toY" :x1="connection.fromX" :y1="connection.fromY" :x2="toX" :y2="toY" stroke="black"
            stroke-width="2" />
        <!-- Arrowhead -->
        <polygon v-if="toX && toY" :points="`
                ${toX},
                ${toY}
                ${getArrowPoints(toX, toY, connection.fromX, connection.fromY).leftX},
                ${getArrowPoints(toX, toY, connection.fromX, connection.fromY).leftY}
                ${getArrowPoints(toX, toY, connection.fromX, connection.fromY).rightX},
                ${getArrowPoints(toX, toY, connection.fromX, connection.fromY).rightY}
            `" fill="black" />
    </svg>
</template>
