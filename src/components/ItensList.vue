<template>
  <div class="swipe-item-container">
    <!-- Fundo revelado ao arrastar para a DIREITA (Marcar / Desmarcar) -->
    <div
      v-show="offsetX > 0"
      class="swipe-track swipe-track-right"
      :class="{
        'ready-trigger': offsetX >= rightThreshold,
        'uncheck-mode': checkedList,
      }"
    >
      <span class="swipe-track-icon">{{ checkedList ? '↺' : '✓' }}</span>
      <span class="swipe-track-label">
        {{ checkedList ? 'Desmarcar' : 'No carrinho' }}
      </span>
    </div>

    <!-- Ações reveladas ao arrastar para a ESQUERDA (Editar / Excluir) -->
    <div
      v-show="offsetX < 0 || swipeAberto"
      class="swipe-actions-left"
    >
      <button
        type="button"
        class="swipe-action-btn edit-action"
        aria-label="Editar item"
        @click.stop="triggerEdit"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4967 1.28025C11.1231 0.906583 10.5172 0.906583 10.1436 1.28025L1.28025 10.1436C1.10081 10.323 1 10.5664 1 10.8201V14.0432C1 14.5716 1.42839 15 1.95683 15H5.17986C5.43362 15 5.677 14.8992 5.85644 14.7197L14.7197 5.85644C15.0934 5.48277 15.0934 4.87694 14.7197 4.50327L11.4967 1.28025ZM2.91367 13.0863V11.2165L10.8201 3.31L12.69 5.17986L4.78352 13.0863H2.91367Z" fill="#F8F8F8"/>
        </svg>
        <span>Editar</span>
      </button>

      <button
        type="button"
        class="swipe-action-btn delete-action"
        aria-label="Excluir item"
        @click.stop="triggerDelete"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1.5H10M2.5 4H13.5M12.2 4L11.73 11.52C11.66 12.63 10.74 13.5 9.63 13.5H6.37C5.26 13.5 4.34 12.63 4.27 11.52L3.8 4M6.5 7V10.5M9.5 7V10.5" stroke="#F8F8F8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Excluir</span>
      </button>
    </div>

    <!-- Card principal deslizável -->
    <div
      class="item"
      :class="{
        checked: checkedList,
        dragging: isDragging,
      }"
      :style="cardTransformStyle"
      @click="onCardClick"
      @touchstart.passive="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchEnd"
      @mousedown="onMouseDown"
    >
      <div class="itemMainRow">
        <h1 class="itemName">
          <strong>{{ formattedName }}</strong>
        </h1>

        <div class="pricesArea">
          <p class="uniPrice">
            {{ formattedUnitPrice }}
          </p>
          <p class="totalPrice">
            {{ formattedTotalPrice }}
          </p>
        </div>
      </div>

      <div class="itemBottomRow">
        <div class="quantityInlineControl" @click.stop>
          <button
            type="button"
            class="inline-qty-btn"
            :disabled="listaItem.quantity <= 1"
            aria-label="Diminuir quantidade"
            @click.stop="changeQuantity(-1)"
          >
            −
          </button>

          <span class="qtyValue">
            <strong>{{ listaItem.quantity }}</strong> un
          </span>

          <button
            type="button"
            class="inline-qty-btn"
            aria-label="Aumentar quantidade"
            @click.stop="changeQuantity(1)"
          >
            +
          </button>
        </div>

        <button
          type="button"
          class="card-edit-btn"
          aria-label="Editar detalhes do item"
          title="Editar item"
          @click.stop="triggerEdit"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4967 1.28025C11.1231 0.906583 10.5172 0.906583 10.1436 1.28025L1.28025 10.1436C1.10081 10.323 1 10.5664 1 10.8201V14.0432C1 14.5716 1.42839 15 1.95683 15H5.17986C5.43362 15 5.677 14.8992 5.85644 14.7197L14.7197 5.85644C15.0934 5.48277 15.0934 4.87694 14.7197 4.50327L11.4967 1.28025ZM2.91367 13.0863V11.2165L10.8201 3.31L12.69 5.17986L4.78352 13.0863H2.91367Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import IListItem from '@/interfaces/IListItem';

const LEFT_ACTIONS_WIDTH = 136;
const RIGHT_TRIGGER_THRESHOLD = 72;

export default defineComponent({
  name: 'ItensNoChecked',
  props: {
    listaItem: {
      type: Object as PropType<IListItem>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    checkedList: {
      type: Boolean,
      required: true,
    },
    swipeAberto: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'aoItemClicked',
    'aoEditItem',
    'aoDeleteItem',
    'aoChangeQuantity',
    'aoSwipeToggle',
  ],
  data() {
    return {
      offsetX: 0,
      startX: 0,
      startY: 0,
      baseOffsetX: 0,
      isDragging: false,
      directionLock: null as 'horizontal' | 'vertical' | null,
      suppressNextClick: false,
      rightThreshold: RIGHT_TRIGGER_THRESHOLD,
    };
  },
  computed: {
    formattedName(): string {
      const raw = this.listaItem.name || '';
      if (!raw) return '';
      return raw.charAt(0).toUpperCase() + raw.substring(1);
    },
    formattedUnitPrice(): string {
      return (Number(this.listaItem.price) || 0).toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      });
    },
    formattedTotalPrice(): string {
      return (Number(this.listaItem.total) || 0).toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      });
    },
    cardTransformStyle(): Record<string, string> {
      return {
        transform: `translateX(${this.offsetX}px)`,
      };
    },
  },
  watch: {
    swipeAberto(aberto: boolean) {
      if (!aberto && this.offsetX < 0 && !this.isDragging) {
        this.offsetX = 0;
      } else if (aberto && this.offsetX === 0 && !this.isDragging) {
        this.offsetX = -LEFT_ACTIONS_WIDTH;
      }
    },
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  },
  methods: {
    isInteractiveTarget(target: EventTarget | null): boolean {
      const el = target as HTMLElement | null;
      return Boolean(el && el.closest('button'));
    },
    startGesture(clientX: number, clientY: number) {
      this.startX = clientX;
      this.startY = clientY;
      this.baseOffsetX = this.offsetX;
      this.directionLock = null;
      this.isDragging = false;
    },
    moveGesture(clientX: number, clientY: number, preventDefaultFn?: () => void) {
      const dx = clientX - this.startX;
      const dy = clientY - this.startY;

      if (!this.directionLock) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          return;
        }
        this.directionLock = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      if (this.directionLock === 'vertical') {
        return;
      }

      if (preventDefaultFn) {
        preventDefaultFn();
      }

      this.isDragging = true;
      const rawOffset = this.baseOffsetX + dx;

      if (rawOffset > 0) {
        const damped = rawOffset > 90 ? 90 + (rawOffset - 90) * 0.28 : rawOffset;
        this.offsetX = Math.min(damped, 135);
      } else {
        const minLimit = -LEFT_ACTIONS_WIDTH;
        const damped =
          rawOffset < minLimit
            ? minLimit + (rawOffset - minLimit) * 0.25
            : rawOffset;
        this.offsetX = Math.max(damped, -180);
      }
    },
    endGesture() {
      if (!this.isDragging) {
        this.directionLock = null;
        return;
      }

      this.suppressNextClick = true;
      const finalX = this.offsetX;
      this.isDragging = false;
      this.directionLock = null;

      if (finalX >= RIGHT_TRIGGER_THRESHOLD) {
        this.offsetX = 0;
        this.$emit('aoSwipeToggle', null);
        this.$emit('aoItemClicked', this.listaItem);
        return;
      }

      if (finalX <= -54) {
        this.offsetX = -LEFT_ACTIONS_WIDTH;
        this.$emit('aoSwipeToggle', this.listaItem.id);
      } else {
        this.offsetX = 0;
        this.$emit('aoSwipeToggle', null);
      }
    },
    onTouchStart(event: TouchEvent) {
      if (this.isInteractiveTarget(event.target)) return;
      const touch = event.touches[0];
      this.startGesture(touch.clientX, touch.clientY);
    },
    onTouchMove(event: TouchEvent) {
      if (event.touches.length === 0) return;
      const touch = event.touches[0];
      this.moveGesture(touch.clientX, touch.clientY, () => {
        if (event.cancelable) event.preventDefault();
      });
    },
    onTouchEnd() {
      this.endGesture();
    },
    onMouseDown(event: MouseEvent) {
      if (event.button !== 0 || this.isInteractiveTarget(event.target)) return;
      this.startGesture(event.clientX, event.clientY);
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    },
    onMouseMove(event: MouseEvent) {
      this.moveGesture(event.clientX, event.clientY);
    },
    onMouseUp() {
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
      this.endGesture();
    },
    onCardClick() {
      if (this.suppressNextClick) {
        this.suppressNextClick = false;
        return;
      }
      if (this.offsetX < 0) {
        this.offsetX = 0;
        this.$emit('aoSwipeToggle', null);
        return;
      }
      this.$emit('aoItemClicked', this.listaItem);
    },
    changeQuantity(delta: number) {
      const nextQty = (Number(this.listaItem.quantity) || 1) + delta;
      if (nextQty < 1) return;

      this.$emit('aoChangeQuantity', {
        ...this.listaItem,
        quantity: nextQty,
      });
    },
    triggerEdit() {
      this.offsetX = 0;
      this.$emit('aoSwipeToggle', null);
      this.$emit('aoEditItem', this.listaItem);
    },
    triggerDelete() {
      this.offsetX = 0;
      this.$emit('aoSwipeToggle', null);
      this.$emit('aoDeleteItem', this.listaItem);
    },
  },
});
</script>

<style scoped>
.swipe-item-container {
  position: relative;
  margin: 12px 8px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 3px 4px 8px 0 rgba(0, 0, 0, 0.16);
  user-select: none;
}

.swipe-track {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  font-weight: 700;
  font-size: 14px;
  transition: background-color 0.16s ease;
}

.swipe-track-right {
  justify-content: flex-start;
  background-color: #75BF7A;
  color: #1F3324;
}

.swipe-track-right.ready-trigger {
  background-color: #08912a;
  color: #F8F8F8;
}

.swipe-track-right.uncheck-mode {
  background-color: #5c6b60;
  color: #F8F8F8;
}

.swipe-track-right.uncheck-mode.ready-trigger {
  background-color: #1F3324;
}

.swipe-track-icon {
  font-size: 18px;
  font-weight: 900;
}

.swipe-actions-left {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 136px;
  display: flex;
}

.swipe-action-btn {
  flex: 1;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #F8F8F8;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.edit-action {
  background-color: #2e47a2;
}

.edit-action:active {
  background-color: #233780;
}

.delete-action {
  background-color: #6d0909;
}

.delete-action:active {
  background-color: #8a1414;
}

.item {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #F8F8F8;
  color: #1F3324;
  padding: 14px 16px;
  border-radius: 10px;
  cursor: pointer;
  touch-action: pan-y;
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.18s ease;
}

.item.dragging {
  transition: none;
}

.item.checked {
  box-shadow: inset 3px 5px 10px 0 rgba(0, 0, 0, 0.2);
  background-color: #CFCFCF;
}

.itemMainRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.itemName {
  font-size: 18px;
  line-height: 1.25;
  word-break: break-word;
  flex: 1;
}

.item.checked .itemName,
.item.checked .pricesArea p {
  text-decoration: line-through;
  color: #6e6e6e;
}

.pricesArea {
  text-align: end;
  flex-shrink: 0;
}

.pricesArea .uniPrice {
  color: #8a8a8a;
  font-size: 12px;
}

.pricesArea .totalPrice {
  font-weight: 900;
  font-size: 16px;
}

.itemBottomRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.quantityInlineControl {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #EAEFEA;
  padding: 3px 6px;
  border-radius: 18px;
}

.item.checked .quantityInlineControl {
  background-color: #BEBEBE;
}

.inline-qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background-color: #75BF7A;
  color: #1F3324;
  font-size: 17px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.inline-qty-btn:active:not(:disabled) {
  background-color: #5ca861;
  transform: scale(0.94);
}

.inline-qty-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.item.checked .inline-qty-btn {
  background-color: #9e9e9e;
  color: #2b2b2b;
}

.qtyValue {
  min-width: 40px;
  text-align: center;
  font-size: 13px;
  color: #1F3324;
}

.item.checked .qtyValue {
  color: #555555;
}

.card-edit-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background-color: #2e47a2;
  color: #F8F8F8;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 1px 2px 5px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.card-edit-btn:active {
  transform: scale(0.93);
}
</style>
