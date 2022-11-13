<template>
    <div class="full-item">
        <ButtonQuantity class="deleteItem"> E </ButtonQuantity>

        <label class="item" :for="listaItem.id" @click="clickedItem(listaItem)"  :class="checkedList ? 'checked' : ''"> 
            <h1 class="itemName"><strong> {{ listaItem.name }} </strong></h1>

            <div class="pricesArea">
                <p class="uniPrice"> {{ listaItem.price.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })
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
import { defineComponent, PropType } from 'vue';

import ButtonQuantity from '@/components/ButtonQuantity.vue'
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
    emits: ['aoItemClicked'],
    methods: {
        clickedItem(item: IListItem) {
            this.$emit('aoItemClicked', this.listaItem)
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

.item.checked{
    box-shadow: inset 3px 5px 10px 0px rgb(0 0 0 / 26%);
    background-color: #b9b9b9;
}
.item.checked *{
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

.deleteItem {
    position: absolute;
    grid-column: 5/-1;
    background: #2e47a2;
    color: #e8e8e8;

    right: -10px;
    top: -10px;

    box-shadow: 2px 2px 6px 0 rgba(0, 0, 0, 0.573);
}
</style>
