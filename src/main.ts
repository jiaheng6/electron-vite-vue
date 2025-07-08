import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'

import 'element-plus/dist/index.css'

import './style.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import './demos/ipc'
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

// 路由
import router from './router'

import locale from 'element-plus/es/locale/lang/zh-cn'

createApp(App).use(ElementPlus, { locale }).use(router)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
