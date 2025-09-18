import fetch from "node-fetch";

export type Units = "metric" | "imperial"; // union type

export async function fetchWeather(lat: number, lon: number, units: Units) {
  const isMetric = units !== "imperial";
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "cloud_cover",
      "wind_speed_10m",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_sum",
    ].join(","),
    timezone: "auto",
    temperature_unit: isMetric ? "celsius" : "fahrenheit",
    wind_speed_unit: isMetric ? "kmh" : "mph",
    precipitation_unit: isMetric ? "mm" : "inch",
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const r = await fetch(url, { headers: { "User-Agent": "weather-api-starter/1.0" } });
  if (!r.ok) throw new Error(`Open-Meteo error ${r.status}`);
  return r.json(); // we could define a Response type later
}
