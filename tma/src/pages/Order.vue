<script lang="ts" setup>
import {computed} from "vue"
import {Button} from "@/components/ui/button"
import {Card, CardFooter,} from "@/components/ui/card"
import {Minus, Plus, Trash2} from "lucide-vue-next"
import ProductCard from "@/common/pizza/components/card/component.vue"
import {useProductsStore} from "@/stores/products"
import {initData} from '@tma.js/sdk-vue'

const store = useProductsStore()

const cartItems = computed(() => store.cartItems)
const total = computed(() => store.cartTotal)

const handleIncrement = (id: number | string) => {
  store.incrementQuantity(id)
}

const handleDecrement = (id: number | string) => {
  store.decrementQuantity(id)
}

const handleRemove = (id: number | string) => {
  store.removeFromCart(id)
}

const updateComment = (id: number | string, comment: string) => {
  const item = store.cartItems.find(item => item.id === id)
  if (item) {
    item.comment = comment
  }
}

const createOrderApi = async () => {
  try {
    const user = window.Telegram.WebApp.initDataUnsafe.user
    
    if (!user?.id) {
      alert('Пользователь не найден. Пожалуйста, откройте приложение через Telegram.')
      return
    }

    const products = cartItems.value.map(item => ({
      quantity: item.quantity,
      title: item.title,
      comment: (item as any).comment || null,
    }))

    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products,
        user: {
          tg_id: String(user.id),
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Order created:', result)
    alert('Заказ успешно создан!')
    store.clearCart()
  } catch (error) {
    console.error('Error creating order:', error)
    alert('Ошибка при создании заказа. Попробуйте позже.')
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="mb-6 text-2xl font-bold">Корзина</h1>

    <div v-if="cartItems.length === 0" class="text-center py-10">
      <p class="text-muted-foreground">Ваша корзина пуста</p>
      <Button class="mt-4" variant="secondary" @click="$router.push('/')">
        Перейти в меню
      </Button>
    </div>

    <div v-else class="grid gap-4">
      <Card
        v-for="item in cartItems"
        :key="item.id"
        class="flex flex-col sm:flex-row"
      >
        <div class="flex flex-1 flex-col gap-2 p-4">
          <!-- Product Card Component with all props -->
          <ProductCard
            :id="item.id"
            :title="item.title"
            :description="item.description"
            :price="item.price"
            :image-url="item.imageUrl"
            :image-alt="item.imageAlt"
            :is-new="item.isNew"
            :weight="item.weight"
          />

          <!-- Quantity Controls -->
          <div class="flex items-center gap-2 border-t pt-3">
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                @click="handleDecrement(item.id)"
              >
                <Minus class="h-4 w-4" />
              </Button>

              <span class="w-8 text-center font-medium">{{
                item.quantity
              }}</span>

              <Button
                variant="outline"
                size="icon"
                class="h-8 w-8"
                @click="handleIncrement(item.id)"
              >
                <Plus class="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              @click="handleRemove(item.id)"
            >
              <Trash2 class="mr-2 h-4 w-4" />
              Удалить
            </Button>
          </div>

          <!-- Comment Input -->
          <div class="mt-3">
            <input
              v-model="(item as any).comment"
              type="text"
              placeholder="Комментарий к заказу (необязательно)"
              class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              @input="updateComment(item.id, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <CardFooter class="border-t p-4 sm:border-l sm:border-t-0">
          <div class="flex w-full items-center justify-between">
            <span class="text-sm text-muted-foreground">Итого:</span>
            <span class="text-lg font-bold">
              {{ (item.price * item.quantity).toLocaleString("ru-RU") }} ₽
            </span>
          </div>
        </CardFooter>
      </Card>

      <div class="mt-6 border-t pt-4">
        <div class="flex items-center justify-between">
          <span class="text-xl font-semibold">Общая сумма:</span>
          <span class="text-2xl font-bold">{{
            total.toLocaleString("ru-RU")
          }} ₽</span>
        </div>

        <Button @click="createOrderApi" class="mt-4 w-full" size="lg">
          Отправить заказы
        </Button>
      </div>
    </div>
  </div>
</template>