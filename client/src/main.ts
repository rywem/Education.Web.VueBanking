// Application entry point. ≈ Program.cs for the frontend: create the app,
// (later) register plugins like router/pinia with app.use(...), then mount.
import { createApp } from 'vue'
import App from './App.vue'

// createApp(App).mount('#app') wires the root component to the <div id="app">
// in index.html. The chain stays this short until you add plugins:
//   const app = createApp(App)
//   app.use(router)
//   app.use(createPinia())
//   app.mount('#app')
createApp(App).mount('#app')
