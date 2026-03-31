<script setup lang="ts">
import { Home, ShoppingCart } from "lucide-vue-next";
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useProductsStore } from "@/stores/products";

const route = useRoute();
const store = useProductsStore()

const cartItemsCount = computed(() => store.cartItemsCount)

const isActive = (path: string) => {
  return route.path === path;
};

const getTabClasses = (path: string) => {
  const baseClasses = "flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors";
  const activeClasses = isActive(path) ? "text-primary" : "text-muted-foreground hover:text-foreground";
  return `${baseClasses} ${activeClasses}`;
};
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 border-t bg-background md:hidden">
    <div class="container mx-auto flex h-16 items-center justify-around">
      <!-- Home Tab -->
      <router-link to="/" :class="getTabClasses('/')">
        <Home class="h-6 w-6" />
        <span class="text-xs">Главная</span>
      </router-link>

      <!-- Orders Tab -->
      <router-link to="/orders" :class="getTabClasses('/orders')">
        <div class="relative">
          <ShoppingCart class="h-6 w-6" />
          <span
            v-if="cartItemsCount > 0"
            class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
          >
            {{ cartItemsCount }}
          </span>
        </div>
        <span class="text-xs">Заказы</span>
      </router-link>
    </div>
  </nav>
</template>
