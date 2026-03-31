import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // 样式文件必须引入！

const app = createApp(App)

app.use(createPinia())
app.use(router).use(ElementPlus)

app.mount('#app')
