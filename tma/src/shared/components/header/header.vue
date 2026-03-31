<script setup lang="ts">
import {Search, ShoppingCart,} from "lucide-vue-next";
import {computed} from "vue";
import {useProductsStore} from "@/stores/products";

const store = useProductsStore()
const cartItemsCount = computed(() => store.cartItemsCount);

const handleCartClick = () => {
  console.log("Cart clicked");
};

const handleSearch = (query: string) => {
  console.log("Search:", query);
};
</script>

<template>
  <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
    <div class="container mx-auto flex h-16 items-center gap-4 px-4">
      <a href="/" class="flex items-center gap-2">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span class="text-lg font-bold">P</span>
        </div>
      </a>

      <div class="flex w-full items-center gap-2">
        <div class="relative w-full">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Найти пиццу..."
            class="h-10 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            @input="handleSearch(($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="relative hidden h-10 items-center gap-2 rounded-md bg-primary px-4 text-primary-foreground hover:bg-primary/90 md:flex"
          @click="handleCartClick"
        >
          <ShoppingCart class="h-5 w-5" />
          <span class="font-medium">Корзина</span>
          <span
            v-if="cartItemsCount > 0"
            class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
          >
            {{ cartItemsCount }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>
