// ---------------------------------------------------------------------------
// Education.Web.VueBanking.Server — ASP.NET Core minimal API
//
// This is deliberately the same shape you already write daily: WebApplication
// builder, service registration, middleware pipeline, endpoint mapping.
// The only frontend-specific additions are (1) the CORS policy and
// (2) the OpenAPI document, both flagged below.
// ---------------------------------------------------------------------------

var builder = WebApplication.CreateBuilder(args);

// Named CORS policy. In DEV you typically won't hit this at all because the
// Vite dev server proxies /api to this process (same-origin from the browser's
// point of view — see client/vite.config.ts). CORS matters once the SPA is
// deployed to a DIFFERENT origin than the API (e.g. Azure Static Web Apps
// calling an App Service). Listing it now means prod "just works" later.
//
// GOTCHA for Blazor refugees: there is no SignalR circuit here. The browser
// makes plain HTTP calls. CORS is a *browser* enforcement, not a server one —
// the server happily responds; the browser blocks the JS from reading the
// response unless these headers are present.
const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",   // Vite dev server (default)
                "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();           // needed if you later send cookies/auth
    });
});

// Built-in OpenAPI document. Serves a spec at /openapi/v1.json in Development.
// This is your contract surface for generating TS types (see README §"Type sharing").
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();          // GET /openapi/v1.json
    app.UseCors(DevCorsPolicy);
}

app.UseHttpsRedirection();

// --- Sample endpoint -------------------------------------------------------
// The classic forecast, but typed. The record below is your DTO; the TS
// interface in client/src/api/types.ts is its hand-mirrored twin. Keeping them
// in sync manually is fine until it isn't — the README covers auto-generation.
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild",
    "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/api/forecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast(
            Date: DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC: Random.Shared.Next(-20, 55),
            Summary: summaries[Random.Shared.Next(summaries.Length)]))
        .ToArray();

    return forecast;
})
.WithName("GetForecast");   // operationId in the OpenAPI doc → TS function name

app.Run();

// A record DTO. System.Text.Json serializes properties as camelCase by default
// in ASP.NET Core, so `TemperatureC` becomes `temperatureC` on the wire — which
// is why the TS interface uses camelCase. (This trips up people expecting
// PascalCase JSON the way old Newtonsoft defaults used to give you.)
public record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
