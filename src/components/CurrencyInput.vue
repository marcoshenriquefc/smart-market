<template>
  <div class="currency-input-wrapper">
    <input
      ref="inputRef"
      :id="id"
      :name="name"
      class="currency-input"
      :class="{ 'is-zero': cents === 0 }"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :value="formattedValue"
      @input="onInput"
      @keydown="onKeyDown"
      @focus="moveCursorToEnd"
      @click="moveCursorToEnd"
    />
    <button
      v-if="cents > 0"
      type="button"
      class="currency-clear-btn"
      aria-label="Zerar valor"
      title="Zerar valor"
      @click="clearValue"
    >
      ✕
    </button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref } from 'vue';

const MAX_DIGITS = 9; // Até R$ 9.999.999,99

function formatCentsToBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default defineComponent({
  name: 'CurrencyInput',
  props: {
    modelValue: {
      type: Number,
      default: 0,
    },
    id: {
      type: String,
      default: undefined,
    },
    name: {
      type: String,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const inputRef = ref<HTMLInputElement | null>(null);

    const cents = computed(() => {
      const numeric = Number(props.modelValue);
      if (!Number.isFinite(numeric) || numeric < 0) return 0;
      return Math.round(numeric * 100);
    });

    const formattedValue = computed(() => formatCentsToBRL(cents.value));

    const syncCaretEnd = () => {
      const el = inputRef.value;
      if (!el) return;
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {
        // Ignora caso o navegador não suporte seleção no estado atual
      }
    };

    const moveCursorToEnd = () => {
      nextTick(syncCaretEnd);
    };

    const updateFromCents = (nextCents: number) => {
      const clamped = Math.max(0, Math.min(nextCents, 999999999));
      const floatVal = clamped / 100;
      emit('update:modelValue', floatVal);

      if (inputRef.value) {
        inputRef.value.value = formatCentsToBRL(clamped);
      }
      moveCursorToEnd();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace') {
        event.preventDefault();
        const nextCents = Math.floor(cents.value / 10);
        updateFromCents(nextCents);
        return;
      }

      if (event.key === 'Delete') {
        event.preventDefault();
        updateFromCents(0);
      }
    };

    const onInput = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const inputEvent = event as InputEvent;
      const onlyDigits = (target.value || '')
        .replace(/\D/g, '')
        .replace(/^0+/, '')
        .slice(0, MAX_DIGITS);

      let nextCents = onlyDigits ? parseInt(onlyDigits, 10) : 0;
      if (
        inputEvent.inputType === 'deleteContentBackward' &&
        nextCents === cents.value
      ) {
        nextCents = Math.floor(cents.value / 10);
      }
      updateFromCents(nextCents);
    };

    const clearValue = () => {
      updateFromCents(0);
      nextTick(() => {
        inputRef.value?.focus();
        syncCaretEnd();
      });
    };

    return {
      inputRef,
      cents,
      formattedValue,
      onInput,
      onKeyDown,
      moveCursorToEnd,
      clearValue,
    };
  },
});
</script>

<style scoped>
.currency-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.currency-input {
  height: 44px;
  width: 100%;
  padding: 8px 34px 8px 12px;
  font-size: 16px;
  font-weight: 700;
  color: #1F3324;
  background-color: #FFFFFF;
  border: 1px solid #D4DDD6;
  border-radius: 10px;
  outline: none;
  font-variant-numeric: tabular-nums;
}

.currency-input.is-zero {
  color: #7a867d;
  font-weight: 500;
}

.currency-input:focus {
  border-color: #75BF7A;
  box-shadow: 0 0 0 2px rgba(117, 191, 122, 0.3);
}

.currency-clear-btn {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background-color: #E2E8E3;
  color: #1F3324;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.currency-clear-btn:active {
  background-color: #cad5cc;
}
</style>
