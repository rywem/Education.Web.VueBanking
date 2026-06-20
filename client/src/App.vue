<script setup lang="ts">
// Root component. The rename script rewrites the <h1> below.
import ForecastPanel from '@/components/ForecastPanel.vue'
</script>

<template>
  <main>
    <!-- APP_TITLE_PLACEHOLDER -->
    <h1>Education.Web.Vue Banking</h1>
    <p>Vue 3 + TypeScript + Vite, talking to an ASP.NET Core minimal API.</p>
    <ForecastPanel />
  </main>
</template>

<style scoped>
main {
  max-width: 42rem;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}
</style>
