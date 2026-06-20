// ---------------------------------------------------------------------------
// API types — the TS twins of your C# DTOs.
//
// These mirror the records in server/Program.cs. Note camelCase: ASP.NET Core's
// System.Text.Json serializes C# PascalCase properties as camelCase by default,
// so the wire shape is camelCase even though the C# is PascalCase.
//
// Hand-maintaining these is fine for a handful of types. Once the contract
// grows, generate them from the OpenAPI doc instead (README §"Type sharing").
// ---------------------------------------------------------------------------

export interface WeatherForecast {
  /** ISO date string, e.g. "2026-06-20". C# DateOnly serializes this way. */
  date: string
  temperatureC: number
  temperatureF: number
  /** Nullable in C# (string?), so optional/undefined here. */
  summary?: string
}
