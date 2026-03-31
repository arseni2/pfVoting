<script setup lang="ts">
import Header from "@/shared/components/header/header.vue"
import BottomNav from "@/shared/components/bottom-nav/bottom-nav.vue"


export type ProductBadge = "new"
    | "hit"
    | "spicy"
    | "piquant"
    | "kids"
    | "old"
    | "combo_15"
    | "combo_20"
    | "combo_25"
    | "combo_30";

export interface ProductAddition {
  categoryId: number;
  itemIds: number[];
  logic: "toppings" | "free_sauce";
  totalMaxAvailable: number;
}

export interface ProductRemovableIngredient {
  id: number;
}

export interface PizzaParameters {
  diameter?: string | number;
  dough?: string;
  size?: string;
}

export interface ProductParameters {
  pizza?: PizzaParameters;
  option?: {
    maxAvailable: number;
    selectedByDefault: boolean;
    skipWeightCalculation: boolean;
  };
}

export interface ProductNutrients {
  calories: string;
  carbs: string;
  fats: string;
  joules: string;
  proteins: string;
}

export interface ProductOption {
  additions: ProductAddition[];
  removableIngredients: (number | ProductRemovableIngredient)[];
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  oldPrice?: number | null;
  image: string;
  weight: number;
  stopped: boolean;
  badges?: ProductBadge[];
  categoryId: number;
  keywords?: string[];
  metaDescription?: string;
  nutrients?: ProductNutrients;
  options?: ProductOption;
  parameters?: ProductParameters;
  availableAt?: string | null;
  caption?: string;
  combo?: unknown;
  commonBonusRate?: number | null;
  constructor?: unknown;
  constructorType?: string;
  editable?: boolean;
  shortTitle?: string;
}

export interface CategoryItem {
  availableAt: string | null;
  description: string;
  editable: boolean;
  products: number[];
  stopped: boolean;
  title: string;
}

export interface Category {
  availableAt: string | null;
  caption: string;
  id: number;
  image: string;
  items: CategoryItem[];
  stopped: boolean;
  title: string;
}

export interface CatalogData {
  categories: Category[];
  products: Record<string, Product>;
}

export interface ProductCardItem {
  id: number | string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  isNew: boolean;
  weight?: string;
}

export interface CategoryWithProducts {
  id: number;
  title: string;
  caption: string;
  image: string;
  availableAt: string | null;
  stopped: boolean;
  productIds: { itemId: number; itemTitle: string }[];
}


</script>

<template>
  <div class="flex min-h-screen flex-col">
    <Header />
    <main class="flex-1 pb-16 md:pb-0">
      <router-view />
    </main>
    <BottomNav />
  </div>
</template>
