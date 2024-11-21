import { onMounted, watch, type Ref } from 'vue';
import Panzoom from '@panzoom/panzoom';
import type { PanzoomObject } from '@panzoom/panzoom';

import { usePanzoomStore } from '@/stores/panzoom';
import type { EditorDraggableElement } from '@/stores/editor';

export function useDraggablePanzoom(intialDraggableElement: EditorDraggableElement, draggableElementRef: Ref<HTMLElement | null>) {
  const panzoomStore = usePanzoomStore();
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
    });

    const initialX = intialDraggableElement.x || 50;
    const initialY = intialDraggableElement.y || 50;

    setTimeout(() => {
        if (!panzoom2) return;
        console.log('initialX', initialX, 'initialY', initialY);
        panzoom2.pan(initialX, initialY);
    }, 0);

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
  });

  return {
    draggableElementRef,
  };
}
