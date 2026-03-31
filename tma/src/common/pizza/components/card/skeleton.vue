<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
</script>

<template>
  <Card class="flex animate-pulse">
    <CardHeader class="relative p-0">
      <div class="relative max-w-80 overflow-hidden rounded-lg">
        <Skeleton class="h-48 w-full" />
      </div>
    </CardHeader>

    <CardContent class="flex flex-col gap-2 pl-4">
      <Skeleton class="h-7 w-3/4" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-5/6" />
      <Skeleton class="h-4 w-4/5" />

      <CardFooter class="flex items-center justify-between p-0 mt-auto">
        <Skeleton class="h-4 w-12" />
        <Skeleton class="h-10 w-24" />
      </CardFooter>
    </CardContent>
  </Card>
</template>
