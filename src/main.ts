import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'

// Build-time font loading. No runtime Google Fonts request.
import '@fontsource-variable/schibsted-grotesk'
import '@fontsource-variable/work-sans'

import './style.css'
import App from './App.vue'
import router from './router'
import { queryClient } from './lib/queryClient'

const app = createApp(App)
app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(router)
app.mount('#app')
