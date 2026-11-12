<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="aberta"
        class="sheet-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="titulo"
        @click.self="fechar"
      >
        <div
          class="sheet-panel"
          :style="sheetDragStyle"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="sheet-handle-area" @click="fechar">
            <span class="sheet-handle"></span>
          </div>

          <header class="sheet-header">
            <h2 class="sheet-title">{{ titulo }}</h2>
            <button
              type="button"
              class="sheet-close"
              aria-label="Fechar painel"
              @click="fechar"
            >
              ✕
            </button>
          </header>

          <div class="sheet-body">
            <slot></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BottomSheet',
  props: {
    aberta: {
      type: Boolean,
      required: true,
    },
    titulo: {
      type: String,
      default: '',
    },
  },
  emits: ['fechar'],
  data() {
    return {
      touchStartY: 0,
      dragOffsetY: 0,
      isDragging: false,
    };
  },
  computed: {
    sheetDragStyle(): Record<string, string> {
      if (!this.isDragging || this.dragOffsetY <= 0) {
        return {};
      }
      return {
        transform: `translateY(${this.dragOffsetY}px)`,
        transition: 'none',
      };
    },
  },
  watch: {
    aberta(nova: boolean) {
      document.body.style.overflow = nova ? 'hidden' : '';
      if (!nova) {
        this.dragOffsetY = 0;
        this.isDragging = false;
      }
    },
  },
  mounted() {
    window.addEventListener('keydown', this.onKeyDown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    document.body.style.overflow = '';
  },
  methods: {
    fechar() {
      this.$emit('fechar');
    },
    onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && this.aberta) {
        this.fechar();
      }
    },
    onTouchStart(event: TouchEvent) {
      const target = event.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, button')) {
        return;
      }
      this.touchStartY = event.touches[0].clientY;
      this.isDragging = true;
    },
    onTouchMove(event: TouchEvent) {
      if (!this.isDragging) return;
      const deltaY = event.touches[0].clientY - this.touchStartY;
      this.dragOffsetY = deltaY > 0 ? deltaY : 0;
    },
    onTouchEnd() {
      if (!this.isDragging) return;
      const shouldClose = this.dragOffsetY > 75;
      this.isDragging = false;
      this.dragOffsetY = 0;
      if (shouldClose) {
        this.fechar();
      }
    },
  },
});
</script>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.48);
}

.sheet-panel {
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  overflow-y: auto;
  background-color: #F8F8F8;
  color: #1F3324;
  border-radius: 22px 22px 0 0;
  padding: 10px 20px calc(24px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.28);
}

.sheet-handle-area {
  display: flex;
  justify-content: center;
  padding: 4px 0 10px;
  cursor: pointer;
}

.sheet-handle {
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background-color: #CFCFCF;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  color: #1F3324;
}

.sheet-close {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background-color: #EAEAEA;
  color: #1F3324;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-close:active {
  background-color: #D9D9D9;
}

.sheet-body {
  display: flex;
  flex-direction: column;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: background-color 0.24s ease;
}

.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  background-color: rgba(0, 0, 0, 0);
}

.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
