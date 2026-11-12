<template>
	<header class="headerMenu">
		<div class="headerContent">
			<div class="brandArea">
				<div class="logoRow">
					<h1 class="logo">Smart <span class="marketName">market</span></h1>
					<button
						v-if="canInstallPwa"
						type="button"
						class="installPwaBtn"
						title="Instalar aplicativo na tela inicial"
						@click="installApp"
					>
						⬇ Instalar
					</button>
				</div>

				<div class="metaRow">
					<span v-if="totalCount > 0" class="counterBadge">
						{{ checkedCount }}/{{ totalCount }} no carrinho
					</span>

					<span
						class="syncBadge"
						:class="syncBadgeClass"
						:title="syncTooltip"
					>
						<span class="statusDot"></span>
						{{ syncLabel }}
					</span>
				</div>
			</div>

			<p class="total-price">
				Total: {{ totalItensPrice }}
			</p>
		</div>
	</header>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import useStore from '@/store';
import { canInstallPwa, promptPwaInstall } from '@/pwa/registerServiceWorker';

export default defineComponent({
	name: 'HeaderMenu',
	setup() {
		const store = useStore();

		const isOnline = computed(() => store.state.isOnline);
		const syncStatus = computed(() => store.state.syncStatus);
		const pendingCount = computed(() => store.state.pendingSyncCount);

		const syncLabel = computed(() => {
			if (!isOnline.value) {
				return pendingCount.value > 0
					? `Offline · ${pendingCount.value} na fila`
					: 'Offline · salvo local';
			}
			if (syncStatus.value === 'syncing') {
				return 'Sincronizando...';
			}
			if (syncStatus.value === 'error' || pendingCount.value > 0) {
				return `${pendingCount.value} pendente(s)`;
			}
			return 'Offline-ready';
		});

		const syncBadgeClass = computed(() => {
			if (!isOnline.value) return 'is-offline';
			if (syncStatus.value === 'syncing') return 'is-syncing';
			if (syncStatus.value === 'error') return 'is-pending';
			return 'is-ready';
		});

		const syncTooltip = computed(() => {
			if (!isOnline.value) {
				return 'Sem internet: suas alterações estão salvas no aparelho e sincronizam automaticamente quando a rede voltar.';
			}
			if (syncStatus.value === 'syncing') {
				return 'Sincronizando alterações em segundo plano...';
			}
			return 'Lista salva localmente no dispositivo (IndexedDB) com suporte offline.';
		});

		const installApp = () => {
			void promptPwaInstall();
		};

		return {
			canInstallPwa,
			installApp,
			totalItensPrice: computed(() =>
				store.state.total.toLocaleString('pt-br', {
					style: 'currency',
					currency: 'BRL',
				})
			),
			totalCount: computed(() => store.state.listItem.length),
			checkedCount: computed(
				() => store.state.listItem.filter((item) => item.checked).length
			),
			syncLabel,
			syncBadgeClass,
			syncTooltip,
		};
	},
});
</script>

<style scoped>
.headerMenu {
	background-color: #75BF7A;
	padding: 12px 16px 8px;
}

.headerContent {
	max-width: 600px;
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
}

.brandArea {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	min-width: 0;
}

.logoRow {
	display: flex;
	align-items: center;
	gap: 8px;
}

.logo {
	font-size: 23px;
	line-height: 1.1;
	text-transform: uppercase;
	font-weight: 900;
	color: #1F3324;
}

.marketName {
	color: white;
	font-weight: 300;
	font-size: 17px;
	text-transform: lowercase;
}

.installPwaBtn {
	border: none;
	border-radius: 12px;
	background-color: #1F3324;
	color: #F8F8F8;
	font-size: 11px;
	font-weight: 700;
	padding: 3px 8px;
	cursor: pointer;
}

.installPwaBtn:active {
	transform: scale(0.95);
}

.metaRow {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6px;
}

.counterBadge {
	font-size: 11px;
	font-weight: 600;
	color: #1F3324;
	opacity: 0.9;
}

.syncBadge {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	font-size: 10px;
	font-weight: 700;
	padding: 2px 7px;
	border-radius: 999px;
	background-color: rgba(31, 51, 36, 0.14);
	color: #1F3324;
}

.syncBadge.is-offline {
	background-color: #1F3324;
	color: #F8F8F8;
}

.syncBadge.is-syncing {
	background-color: #F8F8F8;
	color: #1F3324;
}

.syncBadge.is-pending {
	background-color: #6d0909;
	color: #F8F8F8;
}

.statusDot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background-color: #08912a;
}

.syncBadge.is-offline .statusDot {
	background-color: #f5b942;
}

.syncBadge.is-syncing .statusDot {
	background-color: #2e47a2;
	animation: syncPulse 0.9s infinite alternate;
}

.syncBadge.is-pending .statusDot {
	background-color: #ff8a8a;
}

@keyframes syncPulse {
	from {
		opacity: 0.35;
	}
	to {
		opacity: 1;
	}
}

.total-price {
	background-color: #F8F8F8;
	font-weight: 700;
	font-size: 14px;
	padding: 6px 12px;
	color: #1F3324;
	box-shadow: inset 4px 4px 3px rgba(0, 0, 0, 0.15);
	border-radius: 6px;
	white-space: nowrap;
	flex-shrink: 0;
}
</style>
