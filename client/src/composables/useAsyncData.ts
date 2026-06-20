// ---------------------------------------------------------------------------
// useAsyncData — a composable that wraps any Promise-returning function in
// reactive { data, error, loading } state plus a re-run function.
//
// .NET analogy: think of an extension method that returns a small object
// holding observable state — but instead of you raising INotifyPropertyChanged,
// the refs ARE the change notification. Any template that reads `loading` will
// re-render the instant it flips, automatically.
//
// This is the pattern Vue does dramatically better than Blazor: reusable
// *stateful* logic that isn't a component and isn't a service registration.
// It's just a function that creates some refs and returns them. Composables are
// the single biggest reason to like Vue over Blazor — lean in here.
//
// Naming convention: composables are named useXxx (community convention, not a
// hard rule — but tooling and every other dev assume it). They may only be
// called synchronously from <script setup> or another composable, because they
// hook into the component instance that's "current" at call time.
// ---------------------------------------------------------------------------

import { ref, shallowRef } from 'vue'
import type { Ref } from 'vue'
import { ApiError } from '@/api/client'

export interface UseAsyncData<T> {
  /** The resolved value, or null until the first successful load. */
  data: Ref<T | null>
  /** Human-readable error message, or null. */
  error: Ref<string | null>
  /** True while a call is in flight. */
  loading: Ref<boolean>
  /** Run (or re-run) the async function. */
  execute: () => Promise<void>
}

export function useAsyncData<T>(
  fn: () => Promise<T>,
): UseAsyncData<T> {
  // shallowRef for data: we only care about replacing the whole value, not
  // deeply tracking every nested property. For large API payloads this avoids
  // the cost of Vue recursively wrapping every nested object in a Proxy.
  // (ref() would deep-track; shallowRef() tracks only the top-level .value
  // assignment. Use ref() when you mutate nested fields and want reactivity.)
  const data = shallowRef<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  async function execute(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      data.value = await fn()
    } catch (e) {
      // Narrow the error. ApiError carries a status; everything else is
      // network/unknown. No `catch (Exception ex)` swallowing — be specific.
      if (e instanceof ApiError) {
        error.value = `Request failed (${e.status} ${e.statusText})`
      } else if (e instanceof Error) {
        error.value = e.message
      } else {
        error.value = 'Unknown error'
      }
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
