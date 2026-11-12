<template>
  <div class="thumb-bar-wrapper">
    <form class="thumb-bar" @submit.prevent="handleQuickSubmit">
      <input
        ref="quickInputRef"
        v-model="quickName"
        class="quick-input"
        type="text"
        name="quick-name-item"
        placeholder="Adicionar item rápido..."
        aria-label="Nome do produto para adição rápida"
      />

      <button
        type="button"
        class="details-trigger"
        title="Informar quantidade e preço"
        @click="openDetailsSheet"
      >
        Qtd / R$
      </button>

      <button
        type="submit"
        class="fab-add"
        :aria-label="quickName.trim() ? 'Adicionar produto agora' : 'Abrir painel de novo produto'"
      >
        <span class="fab-plus">+</span>
      </button>
    </form>

    <BottomSheet
      :aberta="sheetOpen"
      titulo="Novo Produto"
      @fechar="closeDetailsSheet"
    >
      <form class="sheet-form" @submit.prevent="addDetailedItem">
        <div class="field-group">
          <label for="sheet-name-item">Produto</label>
          <input
            ref="sheetNameRef"
            v-model="nameItem"
            class="sheet-input"
            type="text"
            id="sheet-name-item"
            placeholder="Ex.: Café torrado 500g"
            required
          />
        </div>

        <div class="field-row">
          <div class="field-group">
            <label for="sheet-quantity-item">Quantidade</label>
            <div class="stepper-control">
              <button
                type="button"
                class="stepper-btn"
                aria-label="Diminuir quantidade"
                @click="decrementQty"
              >
                −
              </button>
              <input
                v-model.number="quantityItem"
                class="sheet-input stepper-input"
                type="number"
                id="sheet-quantity-item"
                min="1"
                required
              />
              <button
                type="button"
                class="stepper-btn"
                aria-label="Aumentar quantidade"
                @click="incrementQty"
              >
                +
              </button>
            </div>
          </div>

          <div class="field-group">
            <label for="sheet-price-item">Preço un. (opcional)</label>
            <CurrencyInput
              id="sheet-price-item"
              name="price-item"
              v-model="priceItem"
            />
          </div>
        </div>

        <div class="sheet-footer">
          <p class="subtotal-preview">
            Subtotal: {{ previewSubtotal }}
          </p>
          <ButtonMain cor="green" type="submit">
            Adicionar
          </ButtonMain>
        </div>
      </form>
    </BottomSheet>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, ref } from 'vue';
import ButtonMain from '@/components/ButtonMain.vue';
import BottomSheet from '@/components/BottomSheet.vue';
import CurrencyInput from '@/components/CurrencyInput.vue';
import useStore from '@/store';
import { SAVE_ITEM } from '@/store/typeMutation';

export default defineComponent({
  name: 'FormAdd',
  components: {
    ButtonMain,
    BottomSheet,
    CurrencyInput,
  },
  setup() {
    const store = useStore();
    const quickName = ref('');
    const sheetOpen = ref(false);
    const quantityItem = ref<number>(1);
    const nameItem = ref('');
    const priceItem = ref<number>(0);

    const quickInputRef = ref<HTMLInputElement | null>(null);
    const sheetNameRef = ref<HTMLInputElement | null>(null);

    const previewSubtotal = computed(() => {
      const qty = Number(quantityItem.value) > 0 ? Number(quantityItem.value) : 1;
      const price = Number(priceItem.value) >= 0 ? Number(priceItem.value) : 0;
      return (qty * price).toLocaleString('pt-br', {
        style: 'currency',
        currency: 'BRL',
      });
    });

    const openDetailsSheet = () => {
      nameItem.value = quickName.value.trim();
      quantityItem.value = 1;
      priceItem.value = 0;
      sheetOpen.value = true;
      nextTick(() => {
        sheetNameRef.value?.focus();
      });
    };

    const closeDetailsSheet = () => {
      sheetOpen.value = false;
    };

    const handleQuickSubmit = () => {
      const trimmed = quickName.value.trim();
      if (!trimmed) {
        openDetailsSheet();
        return;
      }

      store.commit(SAVE_ITEM, {
        quantity: 1,
        name: trimmed,
        price: 0,
        total: 0,
      });

      quickName.value = '';
      nextTick(() => {
        quickInputRef.value?.focus();
      });
    };

    const addDetailedItem = () => {
      const trimmed = nameItem.value.trim();
      if (!trimmed) return;

      const qty = Number(quantityItem.value) > 0 ? Number(quantityItem.value) : 1;
      const price = Number(priceItem.value) >= 0 ? Number(priceItem.value) : 0;

      store.commit(SAVE_ITEM, {
        quantity: qty,
        name: trimmed,
        price,
        total: qty * price,
      });

      quickName.value = '';
      nameItem.value = '';
      quantityItem.value = 1;
      priceItem.value = 0;
      sheetOpen.value = false;
    };

    const incrementQty = () => {
      quantityItem.value = (Number(quantityItem.value) || 1) + 1;
    };

    const decrementQty = () => {
      const current = Number(quantityItem.value) || 1;
      if (current > 1) {
        quantityItem.value = current - 1;
      }
    };

    return {
      quickName,
      sheetOpen,
      quantityItem,
      nameItem,
      priceItem,
      quickInputRef,
      sheetNameRef,
      previewSubtotal,
      openDetailsSheet,
      closeDetailsSheet,
      handleQuickSubmit,
      addDetailedItem,
      incrementQty,
      decrementQty,
    };
  },
});
</script>

<style scoped>
.thumb-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background-color: #75BF7A;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.16);
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
}

.thumb-bar {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.quick-input {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  font-size: 16px;
  color: #1F3324;
  background-color: #F8F8F8;
  border: none;
  border-radius: 22px;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.12);
  outline: none;
}

.quick-input::placeholder {
  color: #7a867d;
}

.quick-input:focus {
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.14), 0 0 0 2px #1F3324;
}

.details-trigger {
  height: 44px;
  padding: 0 12px;
  border: none;
  border-radius: 16px;
  background-color: rgba(248, 248, 248, 0.9);
  color: #1F3324;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.details-trigger:active {
  background-color: #E2EAE3;
}

.fab-add {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background-color: #1F3324;
  color: #F8F8F8;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.25);
  cursor: pointer;
}

.fab-add:active {
  transform: scale(0.95);
}

.fab-plus {
  font-size: 26px;
  line-height: 1;
  font-weight: 500;
}

.sheet-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.field-group label {
  font-size: 13px;
  font-weight: 700;
  color: #1F3324;
}

.field-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.sheet-input {
  height: 44px;
  padding: 8px 12px;
  font-size: 16px;
  color: #1F3324;
  background-color: #FFFFFF;
  border: 1px solid #D4DDD6;
  border-radius: 10px;
  width: 100%;
  outline: none;
}

.sheet-input:focus {
  border-color: #75BF7A;
  box-shadow: 0 0 0 2px rgba(117, 191, 122, 0.3);
}

.stepper-control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stepper-btn {
  width: 42px;
  height: 44px;
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  background-color: #75BF7A;
  color: #1F3324;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
}

.stepper-btn:active {
  background-color: #5ea963;
}

.stepper-input {
  text-align: center;
  padding: 8px 4px;
}

.sheet-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 4px;
}

.subtotal-preview {
  background-color: #EFEFEF;
  color: #1F3324;
  font-weight: 700;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: inset 2px 2px 3px rgba(0, 0, 0, 0.12);
}
</style>
