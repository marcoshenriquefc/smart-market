<template>
    <div class="full-item">
        <ButtonQuantity class="buttonEdidItem" @ao-click-button="clickedEditButton">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4967 1.28025C11.1231 0.906583 10.5172 0.906583 10.1436 1.28025L1.28025 10.1436C1.10081 10.323 1 10.5664 1 10.8201V14.0432C1 14.5716 1.42839 15 1.95683 15H5.17986C5.43362 15 5.677 14.8992 5.85644 14.7197L14.7197 5.85644C15.0934 5.48277 15.0934 4.87694 14.7197 4.50327L11.4967 1.28025ZM2.91367 13.0863V11.2165L10.8201 3.31L12.69 5.17986L4.78352 13.0863H2.91367Z" fill="#F2F2F2"/>
            </svg>
        </ButtonQuantity>

        <label class="item" :for="listaItem.id" @click="clickedItem(listaItem)" :class="checkedList ? 'checked' : ''">
            <h1 class="itemName"><strong> {{ listaItem.name.toLowerCase().toUpperCase()[0] + listaItem.name.substring(1) }} </strong></h1>

            <div class="pricesArea">
                <p class="uniPrice"> {{ listaItem.price.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
                }}</p>
                <p class="totalPrice"> {{ listaItem.total.toLocaleString('pt-br', {
                        style: 'currency', currency: 'BRL'
                    })
                }} </p>
            </div>

            <div class="quantityArea">
                <p><strong>Qtd:</strong> {{ listaItem.quantity }}</p>
            </div>
        </label>
    </div>
</template>

<script lang="ts">
//UTILS IMPORT's
import { defineComponent, PropType } from 'vue';

//COMPONENTS IMPORT's
import ButtonQuantity from '@/components/ButtonQuantity.vue'

//INTERFACES IMPORT's
import IListItem from '@/interfaces/IListItem';

export default defineComponent({
    name: "ItensNoChecked",
    components: {
        ButtonQuantity
    },
    data() {
        return {
            checkeditens: [],
        }
    },
    props: {
        listaItem: {
            type: Object as PropType<IListItem>,
            required: true,
        },
        index: {
            type: Number,
            required: true
        },
        checkedList: {
            type: Boolean,
            required: true
        }
    },
    emits: ['aoItemClicked', 'aoEditItem'],
    methods: {
        clickedItem(item: IListItem) {
            this.$emit('aoItemClicked', this.listaItem)
        },
        clickedEditButton(item: IListItem){
            this.$emit('aoEditItem', this.listaItem)
        }
    },
}
)
</script>

<style scoped>
.full-item {
    position: relative;
    margin: 20px 12px;
}

.itemCheck {
    display: none;
}

.itemCheck:checked~.item {
    background-color: #D9D9D9;
}

.itemCheck:checked~.item * {
    text-decoration: line-through;
    color: gray;
}

.item.checked {
    box-shadow: inset 3px 5px 10px 0px rgb(0 0 0 / 26%);
    background-color: #b9b9b9;
}

.item.checked * {
    text-decoration: line-through;
    color: gray;
}

.checkedClick * {
    text-decoration: line-through;
    color: gray;
}

.checkedClick {
    background-color: #D9D9D9;
}

.item {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;

    background-color: #F8F8F8;
    color: #1F3324;
    /* background-color: #fbfbfb; */

    box-shadow: 4px 4px 8px 0 rgba(0, 0, 0, 0.2);
    padding: 20px;

    border-radius: 8px;
    cursor: pointer;
}

.itemName {
    grid-column: 1/5;
    font-size: 20px;
}

.pricesArea {
    text-align: end;
}

.pricesArea .uniPrice {
    color: #9a9a9a;
    font-size: 12px;
}

.pricesArea .totalPrice {
    font-weight: 900;
    font-size: 16px;
}

.quantityArea {
    grid-column: 1/5;
}

.quantityChange {
    background: #99ffb36a;
    color: #1F3324;
    /* border: 1px solid #75BF7A; */
}

.buttonEdidItem svg{
    width: 100%;
    height: 100%;
    max-height: 18px;
}
.buttonEdidItem {
    display: flex;
    align-items: center;
    justify-content: center;

    position: absolute;
    background: #2e47a2;
    color: #e8e8e8;

    right: -10px;
    top: -10px;

    box-shadow: 2px 2px 6px 0 rgba(0, 0, 0, 0.573);
}
</style>
