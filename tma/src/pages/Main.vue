<script setup lang="ts">
import {computed, ref, watch} from "vue";
import PizzaDrawer from "@/common/pizza/components/drawer/PizzaDrawer.vue";
import {useFetch} from "@vueuse/core";
import ProductCard from "@/common/pizza/components/card/component.vue";
import ProductCardSkeleton from "@/common/pizza/components/card/skeleton.vue";
import {useProductsStore} from "@/stores/products";
import {getImageUrl} from "@/common/pizza/utils/utils";
import type {Category, Product} from "@/App.vue";

const store = useProductsStore()
const productId = ref<null | number>(null);

const isDrawerOpen = computed({
  get: () => !!productId.value,
  set: (value) => {
    if (!value) productId.value = null;
  },
});

const {isFetching, error, data} = useFetch("/menu.json", {
  refetch: false,
}).json()


watch(data, (newData) => {
  if (newData) {
    store.setMenuData(newData as { categories: Category[]; products: Record<string, Product> })
  }
}, {immediate: true})


const handleAddToCart = (pId: number | string) => {
  const product = store.getProductById(pId)
  if (product) {
    const category = store.categories.find(cat =>
        cat.items.some(item => item.products.includes(Number(pId)))
    )
    const item = category?.items.find(item => item.products.includes(Number(pId)))

    if (item) {
      store.addToCart(product, item.title)
      // Close drawer if open
      if (productId.value !== null) {
        productId.value = null
      }
    }
  }
}

const handleProductClick = (pId: number | string) => {
  productId.value = Number(pId)
}
</script>

<template>
  <div class="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
    <template v-if="isFetching">
      <ProductCardSkeleton/>
      <ProductCardSkeleton/>
      <ProductCardSkeleton/>
    </template>

    <template v-else-if="error">
      <p class="text-red-500">Ошибка загрузки: {{ error }}</p>
    </template>

    <template v-else>
      <section v-for="category in store.categoriesWithProducts" :key="category.id" class="mb-8">
        <h2 class="text-2xl font-bold mb-4">{{ category.title }}</h2>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProductCard
              v-for="{ itemId, itemTitle } in category.productIds"
              :key="itemId"
              :id="itemId"
              :title="itemTitle"
              :description="store.getProductById(itemId)?.description || ''"
              :price="store.getProductById(itemId)?.price ? parseFloat(store.getProductById(itemId)!.price) : 0"
              :image-url="getImageUrl(store.getProductById(itemId)?.image || '')"
              :image-alt="store.getProductById(itemId)?.title || ''"
              :is-new="false"
              :weight="store.getProductById(itemId)?.weight ? `${store.getProductById(itemId)!.weight} г` : undefined"
              @add-to-cart="handleAddToCart"
              @open-drawer="handleProductClick"
          />
        </div>
      </section>
    </template>

    <PizzaDrawer
        :product="store.getProductById(productId)"
        :products="store.products"
        v-model:open="isDrawerOpen"
        @add-to-cart="handleAddToCart"
    />
  </div>
</template>