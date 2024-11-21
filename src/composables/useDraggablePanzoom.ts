import { computed, onMounted, watch, type Ref } from 'vue';
import Panzoom from '@panzoom/panzoom';
import type { PanzoomObject } from '@panzoom/panzoom';

import { usePanzoomStore } from '@/stores/panzoom';
import { useEditorStore, type EditorDraggableElement } from '@/stores/editor';

export function useDraggablePanzoom(intialDraggableElement: EditorDraggableElement, draggableElementRef: Ref<HTMLElement | null>) {
  const panzoomStore = usePanzoomStore();
  const editorStore = useEditorStore();
  // intialDraggableElement is used to load initial x, y

  let panzoom2: PanzoomObject | null = null;

  onMounted(() => {
    const child = draggableElementRef.value;
    if (!child) {
      throw new Error('Draggable element not found');
    }

    panzoom2 = Panzoom(child, {
      setTransform: (elem: HTMLElement, { x, y, scale }: { x: number, y: number, scale: number }) => {
        const panzoom = panzoomStore.state.panzoom;
        if (!panzoom) {
          throw new Error('Panzoom not found');
        }
        // Adjust the panning according to the parent's scale
        const parentScale = panzoom.getScale();
        panzoom2!.setStyle(
          'transform',
          `scale(${scale}) translate(${x / parentScale}px, ${y / parentScale}px)`
        );
      },
      excludeClass: 'not-draggable',
    });

    panzoomStore.allDataLoaded.then(() => {
      if (!panzoom2) {
        throw new Error('Panzoom not found');
      }
      const initialX = intialDraggableElement.x || 50;
      const initialY = intialDraggableElement.y || 50;
      console.log('initialX', initialX, 'initialY', initialY);
      setTimeout(() => {
        if (!panzoom2) {
          throw new Error('Panzoom not found');
        }
        panzoom2.pan(initialX, initialY);
      }, 0);
    });

    function adjustScale(oldScale: number, newScale: number) {
      if (!panzoom2) return;
      const pan = panzoom2.getPan();
      // Adjust child starting X/Y according to the new scale for panning
      panzoom2.pan((pan.x / oldScale) * newScale, (pan.y / oldScale) * newScale, {
        animate: true,
      });
    }

    // Watch for changes in the panzoomStore's scale
    watch(
      () => panzoomStore.getScale,
      (newScale, oldScale) => {
        adjustScale(oldScale, newScale);
      }
    );

    // Disable context menu event propagation
    child.addEventListener('contextmenu', (event) => {
      event.stopPropagation();
    });

    // watch for changes is panzoom2 pan
    setTimeout(() => {
      child.addEventListener('panzoompan', () => {
        if (!panzoom2) {
          throw new Error('Panzoom not found');
        }
        console.log('panzoom2.getPan()', panzoom2.getPan());
        const { x, y } = panzoom2.getPan();
        const oldScale = 1;
        const newScale = panzoomStore.getScale;
        // (scaledX / oldScale) * newScale = x
        // scaledX / oldScale = x / newScale
        // scaledX = (x / newScale) * oldScale
        const scaledX = (x / newScale) * oldScale;
        const scaledY = (y / newScale) * oldScale;
        editorStore.moveDraggableElement(intialDraggableElement.id, Math.floor(scaledX), Math.floor(scaledY));
      });
    }, 10)
  });

  return {
    draggableElementRef,
    zoomLevel: computed(() => panzoomStore.getScale),
  };
}
