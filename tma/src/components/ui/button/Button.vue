<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Primitive, type PrimitiveProps } from 'radix-vue'

interface Props extends PrimitiveProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: HTMLAttributes['class']
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  as: 'button',
})

const variantStyles: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary:
    'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizeStyles: Record<NonNullable<Props['size']>, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
}
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    :class="
      cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        sizeStyles[size],
        props.class,
      )
    "
    :disabled="disabled"
  >
    <slot />
  </Primitive>
</template>
