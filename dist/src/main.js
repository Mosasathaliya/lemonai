import { createApp } from 'vue';
console.log('main.js started');
import './style.scss';
console.log('style.scss imported');
//ant
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
console.log('Antd imported');
import App from './App.vue';
console.log('App.vue imported');

const app = createApp(App);
console.log('Vue app created');

app.use(Antd);
console.log('Antd used');

import router from "./router/index.js";
console.log('router imported');
app.use(router);
console.log('router used');

import store from "./store";
console.log('store imported');
app.use(store);
console.log('store used');

import i18n from './locals';
console.log('i18n imported');
app.use(i18n);
console.log('i18n used');

// 配置全局 t 函数
app.config.globalProperties.$t = i18n.global.t;
console.log('$t global property configured');

console.log('Attempting to mount app...');
app.mount('#app');
// Hide preloader when Vue is mounted
try { const loader = document.getElementById('app-loader'); if (loader) loader.remove(); } catch {}
console.log('app.mount called');