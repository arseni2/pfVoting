<script setup lang="ts">
import { computed } from "vue";
import { Check } from "lucide-vue-next";

interface AddonCardProps {
  id: number | string;
  title: string;
  price: number | string;
  imageUrl: string;
  imageAlt: string;
  selected?: boolean;
}

const props = withDefaults(defineProps<AddonCardProps>(), {
  selected: false,
});

const emit = defineEmits<{
  select: [addonId: number | string];
}>();

const formattedPrice = computed(() => {
  const price = typeof props.price === "string" ? parseFloat(props.price) : props.price;
  return price.toLocaleString("ru-RU");
});

const handleSelect = () => {
  emit("select", props.id);
};
</script>

<template>
  <li
    class="flex cursor-pointer items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-muted"
    :class="{ 'border-primary bg-muted/50': selected }"
    role="menuitem"
    tabindex="0"
    @click="handleSelect"
    @keydown.enter="handleSelect"
  >
    <!-- Изображение -->
    <div class="relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
      <img
        :src="imageUrl"
        :alt="imageAlt"
        loading="lazy"
        decoding="async"
        class="h-full w-full object-cover"
      />
    </div>

    <!-- Контент -->
    <div class="flex flex-1 flex-col gap-1">
      <span class="text-sm font-medium">{{ title }}</span>
      <h6 class="text-sm font-semibold">
        {{ formattedPrice }} <i class="text-xs font-normal">₽</i>
      </h6>
    </div>

    <!-- Индикатор выбора -->
    <div
      v-if="selected"
      class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <Check class="h-4 w-4" />
    </div>
  </li>
</template>
