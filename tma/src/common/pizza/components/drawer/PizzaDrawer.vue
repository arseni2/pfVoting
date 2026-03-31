<script setup lang="ts">
import {type Product} from "@/App.vue";
import {Button} from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle
} from "@/components/ui/drawer";
import {computed, ref} from "vue";
import {getBadgeClasses, getBadgeLabel, getImageUrl} from "../../utils/utils";
import AddonCard from "@/common/addon/components/card/component.vue";

const {open, product, products} = defineProps<{
  open: boolean;
  product?: Product;
  products?: Record<string, Product>;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
  "addToCart": [productId: number | string]
}>();

const setOpen = (value: boolean) => {
  emit("update:open", value);
};

const hasBadges = computed(() => product?.badges && product.badges.length > 0);

const selectedAddons = ref<Record<number, number | undefined>>({});

const formattedPrice = computed(() => {
  if (!product?.price) return "0";
  return Number(product.price).toLocaleString("ru-RU");
});
const handleClickAddCart = () => {
  emit("addToCart", product?.id ?? "")
  setOpen(false)
}
</script>

<template>
  <Drawer :open="open" @update:open="setOpen">
    <DrawerContent class="">
      <div class="flex flex-col overflow-y-auto">
        <div class="relative w-full shrink-0">
          <img v-if="product?.image" :src="getImageUrl(product.image)" :alt="product.title"
               class="h-full w-full object-cover"/>
          <div class="absolute bottom-0 ml-4 mb-4 flex flex-col gap-2">
            <div
                class="leading-none bg-white flex flex-col items-center justify-center px-2 py-1 rounded-md">
                            <span class="leading-none font-semibold text-md">{{
                                product?.parameters?.pizza?.diameter?.toString().substring(0, 2)
                              }}</span>
              <span class="text-sm text-gray-500" style="line-height: 1;">см</span>
            </div>
            <div
                class="leading-none bg-white flex flex-col items-center justify-center px-2 py-1 rounded-md">
              <span style="line-height: 1;" class="font-semibold text-md">{{ product?.weight }}</span>
              <span class="text-sm text-gray-500" style="line-height: 1;">гр</span>
            </div>
          </div>
        </div>

        <div class="flex flex-1 flex-col gap-4 p-4">
          <div class="flex items-start justify-between gap-2">
            <DrawerTitle class="text-xl font-bold">
              {{ product?.title }}
            </DrawerTitle>
            <div v-if="hasBadges" class="flex shrink-0 gap-1">
                            <span v-for="badge in product?.badges" :key="badge" :class="[
                                'rounded px-2 py-1 text-xs font-medium',
                                getBadgeClasses(badge),
                            ]">
                                {{ getBadgeLabel(badge) }}
                            </span>
            </div>
          </div>

          <div v-if="product?.weight && product.weight > 0" class="text-sm text-muted-foreground">
            {{ product.weight }} г
          </div>

          <p class="text-sm text-muted-foreground">
            {{ product?.description }}
          </p>

          <div v-if="product?.nutrients" class="grid grid-cols-3 gap-2 rounded-lg bg-muted p-3">
            <div class="text-center">
              <div class="text-sm font-semibold">
                {{ product.nutrients.calories }}
              </div>
              <div class="text-xs text-muted-foreground">ккал</div>
            </div>
            <div class="text-center">
              <div class="text-sm font-semibold">
                {{ product.nutrients.proteins }}
              </div>
              <div class="text-xs text-muted-foreground">белки</div>
            </div>
            <div class="text-center">
              <div class="text-sm font-semibold">
                {{ product.nutrients.fats }}/{{ product.nutrients.carbs }}
              </div>
              <div class="text-xs text-muted-foreground">жиры/углеводы</div>
            </div>
          </div>

          <div v-if="product?.options?.additions?.length" class="space-y-4">
            <h5 class="text-sm font-semibold">Добавьте опции</h5>
            {{ console.log(product?.options?.additions) }}
            <div v-for="addition in product.options.additions" :key="addition.categoryId" class="space-y-2">
              <p class="text-xs text-muted-foreground">
                Можно добавить ещё {{ addition.totalMaxAvailable }}
              </p>
              <ul class="space-y-2">
                <!-- <li v-for="itemId in addition.itemIds" :key="itemId">
                    {{ console.log(getAddonProduct(itemId)) }}
                    <AddonCard :id="itemId" :title="getAddonProduct(itemId)?.title || 'Добавка'"
                        :price="getAddonProduct(itemId)?.price || '0'"
                        :image-url="getImageUrl(getAddonProduct(itemId)?.image || '')"
                        :image-alt="getAddonProduct(itemId)?.title || ''"
                        :selected="selectedAddons[addition.categoryId] === itemId"
                        @select="handleAddonSelect(addition.categoryId, itemId)" />
                </li> -->
              </ul>
            </div>
          </div>
        </div>

        <div class="border-t p-4">
          <Button @click="handleClickAddCart" class="w-full" size="lg">
            <span>В корзину</span>
            <span class="ml-2">{{ formattedPrice }} ₽</span>
          </Button>
        </div>
      </div>
    </DrawerContent>
  </Drawer>
</template>
