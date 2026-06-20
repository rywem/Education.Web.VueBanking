// ---------------------------------------------------------------------------
// Endpoints — named, typed functions per API operation.
//
// Why a separate file from client.ts? Same reason you don't scatter raw SQL
// through a codebase: components call getForecast(), not api.get('/forecast').
// The string path and the response type live in exactly one place. When you
// auto-generate a client from OpenAPI later, this file is what it replaces.
// ---------------------------------------------------------------------------

import { api } from './client'
import type { WeatherForecast } from './types'

export function getForecast(): Promise<WeatherForecast[]> {
  return api.get<WeatherForecast[]>('/forecast')
}
