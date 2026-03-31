import { defineStore } from 'pinia'
import type { Product, Category, ProductCardItem } from '@/App.vue'
import { getImageUrl, getIsNew, formatWeight } from '@/common/pizza/utils/utils'

export interface CartItem extends ProductCardItem {
  quantity: number
}

interface ProductsState {
  categories: Category[]
  products: Record<string, Product>
  cart: CartItem[]
  isLoading: boolean
  error: string | null
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    categories: [],
    products: {},
    cart: [],
    isLoading: false,
    error: null,
  }),
  persist: {
    pick: ['cart']
  },
  getters: {
    // Get all categories with their products
    categoriesWithProducts: (state) => {
      return state.categories
        .filter(category => !category.stopped)
        .map(category => ({
          ...category,
          productIds: category.items
            .filter(item => item.products.length > 0 && !item.stopped)
            .map(item => ({
              itemId: item.products[0],
              itemTitle: item.title,
            }))
            .filter(({ itemId }) => {
              const product = state.products[itemId.toString()]
              return product && !product.stopped
            }),
        }))
    },

    // Get product by ID
    getProductById: (state) => (id?: number | string) => {
      if(!id) {
        return null
      }
      return state.products[id.toString()] || null
    },

    // Get cart items
    cartItems: (state) => state.cart,

    // Get cart total
    cartTotal: (state) => {
      return state.cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
    },

    // Get cart items count
    cartItemsCount: (state) => {
      return state.cart.reduce((count, item) => count + item.quantity, 0)
    },

    // Check if product is in cart
    isProductInCart: (state) => (id: number | string) => {
      return state.cart.some(item => item.id === id)
    },

    // Get cart item quantity
    getCartItemQuantity: (state) => (id: number | string) => {
      const item = state.cart.find(item => item.id === id)
      return item ? item.quantity : 0
    },
  },

  actions: {
    // Set menu data
    setMenuData(data: { categories: Category[]; products: Record<string, Product> }) {
      this.categories = data.categories
      this.products = data.products
    },

    // Set loading state
    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    // Set error
    setError(error: string | null) {
      this.error = error
    },

    // Convert product to cart item
    productToCartItem(product: Product, itemTitle: string): CartItem {
      return {
        id: product.id,
        title: itemTitle,
        description: product.description,
        price: parseFloat(product.price),
        imageUrl: getImageUrl(product.image),
        imageAlt: product.title,
        isNew: getIsNew(product.badges),
        weight: formatWeight(product.weight),
        quantity: 1,
      }
    },

    // Add product to cart
    addToCart(product: Product, itemTitle: string) {
      const existingItemIndex = this.cart.findIndex(
        item => item.id === product.id
      )

      if (existingItemIndex !== -1) {
        // Increment quantity if already in cart
        this.cart[existingItemIndex].quantity++
      } else {
        // Add new item to cart
        const cartItem = this.productToCartItem(product, itemTitle)
        this.cart.push(cartItem)
      }
    },

    // Remove product from cart
    removeFromCart(productId: number | string) {
      this.cart = this.cart.filter(item => item.id !== productId)
    },

    // Update product quantity
    updateQuantity(productId: number | string, quantity: number) {
      const itemIndex = this.cart.findIndex(item => item.id === productId)

      if (itemIndex !== -1) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          this.cart.splice(itemIndex, 1)
        } else {
          // Update quantity
          this.cart[itemIndex].quantity = quantity
        }
      }
    },

    // Increment quantity
    incrementQuantity(productId: number | string) {
      const itemIndex = this.cart.findIndex(item => item.id === productId)

      if (itemIndex !== -1) {
        this.cart[itemIndex].quantity++
      }
    },

    // Decrement quantity
    decrementQuantity(productId: number | string) {
      const itemIndex = this.cart.findIndex(item => item.id === productId)

      if (itemIndex !== -1) {
        const currentQuantity = this.cart[itemIndex].quantity
        if (currentQuantity <= 1) {
          this.removeFromCart(productId)
        } else {
          this.cart[itemIndex].quantity--
        }
      }
    },

    // Clear cart
    clearCart() {
      this.cart = []
    },
  },
})
