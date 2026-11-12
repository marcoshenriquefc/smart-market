<template>
	<section v-if="listaItens.length >= 1" class="lists-wrapper">
		<p class="gesture-hint">
			Arraste p/ direita para marcar · p/ esquerda para opções
		</p>

		<h3
			v-if="listaItens.findIndex((i) => i.checked == false) !== -1"
			class="section-heading"
		>
			No Checked
		</h3>
		<div v-for="(listaItem, index) in listaItens" :key="listaItem.id || index">
			<ItensList
				v-if="!listaItem.checked"
				:checkedList="false"
				:listaItem="listaItem"
				:index="index"
				:swipeAberto="activeSwipeId === listaItem.id"
				@ao-item-clicked="clickedItem"
				@ao-edit-item="editItem"
				@ao-delete-item="removeItemWithUndo"
				@ao-change-quantity="changeQuantityInline"
				@ao-swipe-toggle="setActiveSwipe"
			/>
		</div>

		<h3
			v-if="listaItens.findIndex((i) => i.checked == true) !== -1"
			class="section-heading checked-heading"
		>
			Checked
		</h3>
		<div v-for="(listaItem, index) in listaItens" :key="listaItem.id || index">
			<ItensList
				v-if="listaItem.checked"
				:checkedList="true"
				:listaItem="listaItem"
				:index="index"
				:swipeAberto="activeSwipeId === listaItem.id"
				@ao-item-clicked="clickedItem"
				@ao-edit-item="editItem"
				@ao-delete-item="removeItemWithUndo"
				@ao-change-quantity="changeQuantityInline"
				@ao-swipe-toggle="setActiveSwipe"
			/>
		</div>
	</section>

	<section v-else class="empty-state">
		<p class="empty-title">Sua lista está vazia</p>
		<p class="empty-subtitle">
			Use a barra inferior para adicionar produtos com um toque, usando apenas uma mão.
		</p>
	</section>

	<!-- Toast flutuante de Desfazer exclusão (4 segundos) -->
	<Teleport to="body">
		<Transition name="undo-toast">
			<div
				v-if="deletedBackup"
				:key="undoToastKey"
				class="undo-toast"
				role="status"
				aria-live="polite"
			>
				<div class="undo-toast-content">
					<span class="undo-toast-text">
						<strong>{{ deletedBackup.item.name }}</strong> removido
					</span>
					<button
						type="button"
						class="undo-toast-btn"
						@click="undoDelete"
					>
						Desfazer
					</button>
				</div>
				<div class="undo-toast-progress"></div>
			</div>
		</Transition>
	</Teleport>

	<BottomSheet
		:aberta="Boolean(itemClicked)"
		titulo="Editar Item"
		@fechar="cancelEdit"
	>
		<form v-if="itemClicked" class="sheet-edit-form" @submit.prevent="confirmEdit">
			<div class="field-group">
				<label for="name-item-popup">Produto</label>
				<input
					v-model="itemClicked.name"
					class="sheet-input"
					type="text"
					name="name-item"
					id="name-item-popup"
					placeholder="Digite o nome do produto"
					required
				/>
			</div>

			<div class="box-value">
				<div class="field-group">
					<label for="quantity-item-popup">Quantidade</label>
					<div class="stepper-control">
						<button
							type="button"
							class="stepper-btn"
							aria-label="Diminuir quantidade"
							@click="decrementEditQty"
						>
							−
						</button>
						<input
							v-model.number="itemClicked.quantity"
							class="sheet-input stepper-input"
							type="number"
							name="quantity-item"
							id="quantity-item-popup"
							placeholder="01"
							min="1"
							required
						/>
						<button
							type="button"
							class="stepper-btn"
							aria-label="Aumentar quantidade"
							@click="incrementEditQty"
						>
							+
						</button>
					</div>
				</div>

				<div class="field-group">
					<label for="price-item-popup">Preço un. (R$)</label>
					<CurrencyInput
						id="price-item-popup"
						name="price-item"
						v-model="itemClicked.price"
					/>
				</div>
			</div>

			<p class="edit-subtotal">
				Subtotal do item: <strong>{{ editSubtotalFormatted }}</strong>
			</p>

			<div class="buton-area">
				<ButtonMain type="button" @ao-clicado="deleteItemFromSheet" cor="red">
					Excluir
				</ButtonMain>
				<ButtonMain cor="lightGreen" type="submit">
					Confirmar
				</ButtonMain>
			</div>
		</form>
	</BottomSheet>
</template>

<script lang="ts">
import useStore from '@/store';
import { computed, defineComponent } from 'vue';

import ItensList from '@/components/ItensList.vue';
import ButtonMain from '@/components/ButtonMain.vue';
import BottomSheet from '@/components/BottomSheet.vue';
import CurrencyInput from '@/components/CurrencyInput.vue';

import IListItem from '@/interfaces/IListItem';

import {
	CHECKED_ITEM,
	EDIT_ITEM,
	LOAD_STORAGE,
	DELETE_ITEM,
	RESTORE_ITEM,
} from '@/store/typeMutation';

const UNDO_TIMEOUT_MS = 4000;

export default defineComponent({
	name: 'ItemListedView',
	components: {
		ItensList,
		ButtonMain,
		BottomSheet,
		CurrencyInput,
	},
	data() {
		return {
			itemClicked: null as IListItem | null,
			activeSwipeId: null as string | null,
			deletedBackup: null as { item: IListItem; index: number } | null,
			undoTimerId: null as ReturnType<typeof setTimeout> | null,
			undoToastKey: 0,
		};
	},
	computed: {
		editSubtotalFormatted(): string {
			if (!this.itemClicked) return 'R$ 0,00';
			const qty =
				Number(this.itemClicked.quantity) > 0
					? Number(this.itemClicked.quantity)
					: 1;
			const price =
				Number(this.itemClicked.price) >= 0
					? Number(this.itemClicked.price)
					: 0;
			return (qty * price).toLocaleString('pt-br', {
				style: 'currency',
				currency: 'BRL',
			});
		},
	},
	beforeUnmount() {
		if (this.undoTimerId) {
			clearTimeout(this.undoTimerId);
		}
	},
	methods: {
		setActiveSwipe(id: string | null) {
			this.activeSwipeId = id;
		},
		clickedItem(item: IListItem) {
			this.activeSwipeId = null;
			this.store.commit(CHECKED_ITEM, item);
		},
		changeQuantityInline(updatedItem: IListItem) {
			this.store.commit(EDIT_ITEM, updatedItem);
		},
		editItem(item: IListItem) {
			this.activeSwipeId = null;
			this.itemClicked = { ...item };
		},
		cancelEdit() {
			this.itemClicked = null;
		},
		incrementEditQty() {
			if (!this.itemClicked) return;
			this.itemClicked.quantity = (Number(this.itemClicked.quantity) || 1) + 1;
		},
		decrementEditQty() {
			if (!this.itemClicked) return;
			const current = Number(this.itemClicked.quantity) || 1;
			if (current > 1) {
				this.itemClicked.quantity = current - 1;
			}
		},
		confirmEdit() {
			if (!this.itemClicked) return;
			this.store.commit(EDIT_ITEM, this.itemClicked);
			this.itemClicked = null;
		},
		removeItemWithUndo(item: IListItem) {
			const originalIndex = this.store.state.listItem.findIndex(
				(it) => it.id === item.id
			);
			const snapshot: IListItem = {
				...(originalIndex !== -1
					? this.store.state.listItem[originalIndex]
					: item),
			};

			this.store.commit(DELETE_ITEM, snapshot);

			if (this.undoTimerId) {
				clearTimeout(this.undoTimerId);
			}

			this.deletedBackup = {
				item: snapshot,
				index: originalIndex !== -1 ? originalIndex : this.store.state.listItem.length,
			};
			this.undoToastKey += 1;

			this.undoTimerId = setTimeout(() => {
				this.deletedBackup = null;
				this.undoTimerId = null;
			}, UNDO_TIMEOUT_MS);
		},
		deleteItemFromSheet() {
			if (!this.itemClicked) return;
			const target = { ...this.itemClicked };
			this.itemClicked = null;
			this.removeItemWithUndo(target);
		},
		undoDelete() {
			if (!this.deletedBackup) return;
			if (this.undoTimerId) {
				clearTimeout(this.undoTimerId);
				this.undoTimerId = null;
			}
			this.store.commit(RESTORE_ITEM, this.deletedBackup);
			this.deletedBackup = null;
		},
	},
	setup() {
		const store = useStore();
		store.commit(LOAD_STORAGE);

		return {
			store,
			listaItens: computed(() => store.state.listItem),
		};
	},
});
</script>

<style scoped>
.gesture-hint {
	font-size: 11px;
	color: #6b786e;
	text-align: center;
	margin: 2px 12px 10px;
}

.section-heading {
	color: #1F3324;
	font-size: 14px;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	margin: 8px 12px 4px;
}

.checked-heading {
	margin-top: 20px;
	color: #6b746d;
}

.empty-state {
	margin: 48px 16px;
	padding: 28px 20px;
	text-align: center;
	background-color: #F8F8F8;
	border-radius: 14px;
	box-shadow: 2px 4px 10px rgba(0, 0, 0, 0.08);
	color: #1F3324;
}

.empty-title {
	font-size: 18px;
	font-weight: 700;
	margin-bottom: 8px;
}

.empty-subtitle {
	font-size: 14px;
	color: #5c6b60;
	line-height: 1.45;
}

.undo-toast {
	position: fixed;
	left: 14px;
	right: 14px;
	bottom: calc(76px + env(safe-area-inset-bottom, 0px));
	max-width: 560px;
	margin: 0 auto;
	z-index: 40;
	background-color: #1F3324;
	color: #F8F8F8;
	border-radius: 12px;
	overflow: hidden;
	box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
}

.undo-toast-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 12px 14px;
}

.undo-toast-text {
	font-size: 14px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.undo-toast-btn {
	flex-shrink: 0;
	border: none;
	border-radius: 8px;
	background-color: #75BF7A;
	color: #1F3324;
	font-size: 13px;
	font-weight: 700;
	padding: 6px 12px;
	cursor: pointer;
}

.undo-toast-btn:active {
	background-color: #5ca861;
}

.undo-toast-progress {
	height: 3px;
	width: 100%;
	background-color: #75BF7A;
	transform-origin: left center;
	animation: undoCountdown 4s linear forwards;
}

@keyframes undoCountdown {
	from {
		transform: scaleX(1);
	}
	to {
		transform: scaleX(0);
	}
}

.undo-toast-enter-active,
.undo-toast-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.undo-toast-enter-from,
.undo-toast-leave-to {
	opacity: 0;
	transform: translateY(14px);
}

.sheet-edit-form {
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

.box-value {
	display: flex;
	gap: 12px;
	align-items: flex-end;
}

.sheet-input {
	height: 44px;
	font-size: 16px;
	padding: 8px 12px;
	width: 100%;
	color: #1F3324;
	background-color: #FFFFFF;
	border: 1px solid #D4DDD6;
	border-radius: 10px;
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

.edit-subtotal {
	background-color: #EFEFEF;
	color: #1F3324;
	font-size: 14px;
	padding: 10px 14px;
	border-radius: 8px;
	box-shadow: inset 2px 2px 3px rgba(0, 0, 0, 0.1);
}

.buton-area {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding-top: 4px;
}

.buton-area :deep(.buttonMain) {
	flex: 1;
	padding: 12px 16px;
	font-weight: 700;
	font-size: 15px;
}
</style>
