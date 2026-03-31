import {createApp} from "vue";
import "./style.css";
import App from "./App.vue";
import Main from "@/pages/Main.vue";
import Order from "@/pages/Order.vue";
import {createRouter, createWebHistory} from "vue-router";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import {createPinia} from 'pinia'
import {init, initData, isTMA} from '@tma.js/sdk-vue';

init();

console.log('Chat:', initData.chat())
console.log('State:', initData.state())
console.log('ChatInstance:', initData.chatInstance())
console.log('Receiver:', initData.receiver())
console.log("isTMA = ", isTMA())
const routes = [
  {path: "/", component: Main, name: "main"},
  {path: "/orders", component: Order, name: "order"},
];
const pinia = createPinia()


export const router = createRouter({
  history: createWebHistory(),
  routes,
});


pinia.use(piniaPluginPersistedstate)
createApp(App).use(router).use(pinia).mount("#app");
