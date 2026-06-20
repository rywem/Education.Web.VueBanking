<script setup lang="ts">
// <script setup> = the terse, compile-time-sugar form of the Composition API.
// Everything declared at the top level is automatically available to the
// template below — no `return { ... }`, no `export default`. Closest .NET
// analogy: an inline code-behind where locals are auto-exposed to the markup.
//
// `lang="ts"` is what makes this block actually type-checked (by vue-tsc /
// the editor, NOT by Vite at dev time — Vite only strips types for speed).

import { onMounted } from 'vue'
import { getForecast } from '@/api/endpoints'
import { useAsyncData } from '@/composables/useAsyncData'

// One line wires up reactive loading/error/data. `forecast` is the data ref.
// Destructuring here is safe because these are refs (objects), not their
// unwrapped values — we're not breaking reactivity by pulling them out.
const { data: forecast, error, loading, execute } = useAsyncData(getForecast)

// Lifecycle hook ≈ Blazor's OnInitializedAsync, but registered by *calling* a
// function rather than overriding a method. Fires after the component's first
// render is set up. Kick off the initial load here.
onMounted(execute)
</script>

<template>
  <!-- Interpolation {{ }} ≈ Razor's @(...). Directives (v-if/v-for) are
       ATTRIBUTES on elements, not block statements wrapping markup — that's the
       main mental shift from Razor's @if/@foreach. -->
  <section>
    <header>
      <h2>Forecast</h2>
      <!-- @click is shorthand for v-on:click. :disabled is shorthand for
           v-bind:disabled — a bound attribute vs a literal one. -->
      <button :disabled="loading" @click="execute">
        {{ loading ? 'Loading…' : 'Refresh' }}
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <!-- v-for needs a :key for the same reason Blazor wants @key: stable
         identity so the diff/patch doesn't reuse the wrong DOM node. -->
    <ul v-else-if="forecast">
      <li v-for="day in forecast" :key="day.date">
        <strong>{{ day.date }}</strong>
        — {{ day.temperatureC }}°C / {{ day.temperatureF }}°F
        <em v-if="day.summary">({{ day.summary }})</em>
      </li>
    </ul>

    <p v-else-if="loading">Loading forecast…</p>
  </section>
</template>

<style scoped>
/* `scoped` ≈ Blazor's CSS isolation (.razor.css). Vue rewrites these rules with
   a generated data-attribute so they can't leak out of this component. */
.error {
  color: #b00020;
}
header {
  display: flex;
  align-items: center;
  gap: 1rem;
}
</style>
