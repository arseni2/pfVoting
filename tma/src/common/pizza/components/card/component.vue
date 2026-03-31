<script setup lang="ts">
import { computed } from "vue";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProductCardProps {
  id: number | string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  imageAlt: string;
  isNew?: boolean;
  weight?: string;
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  isNew: false,
  weight: undefined,
});

const emit = defineEmits<{
  addToCart: [productId: number | string];
  openDrawer: [productId: number | string];
}>();

const formattedPrice = computed(() => {
  return props.price.toLocaleString("ru-RU");
});

const handleAddToCart = (event: Event) => {
  event.stopPropagation();
  emit("addToCart", props.id);
};

const handleOpenDrawer = () => {
  emit("openDrawer", props.id);
};
</script>

<template>
  <Card
    class="flex group cursor-pointer transition-all duration-200 hover:-translate-y-1"
    role="button"
    tabindex="0"
    @click="handleOpenDrawer"
    @keydown.enter="handleOpenDrawer"
  >
    <CardHeader class="relative p-0">
      <div class="relative w-30 sm:w-34 overflow-hidden rounded-lg">
        <img
          :src="imageUrl"
          :alt="imageAlt"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    </CardHeader>

    <CardContent class="flex flex-col gap-2 pl-4 w-full">
      <CardTitle class="text-md sm:text-lg font-semibold">
        <h1 class="">
          {{ title }}
        </h1>
      </CardTitle>

      <CardDescription class="line-clamp-4 text-sm">
        {{ description }}
      </CardDescription>

      <CardFooter class="flex items-center justify-between p-0 mt-auto">
        <span v-if="weight" class="text-sm text-muted-foreground">
          {{ weight }}
        </span>
        <span v-else class="text-sm"></span>

        <Button
          variant="secondary"
          class="gap-1 text-primary"
          @click="handleAddToCart"
          @keydown.enter="handleAddToCart"
        >
          {{ formattedPrice }}
          <span class="text-xs">₽</span>
        </Button>
      </CardFooter>
    </CardContent>
  </Card>
</template>
