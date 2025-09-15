import { Router } from "express";
import { z } from "zod";
import { fetchWeather, type Units } from "../services/openMeteo.js";
import { getCache, setCache } from "../lib/cache.js";

const router = Router();

type WeatherPayload = { source: "cache" | "open-meteo"; data: unknown };

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
  units: z.enum(["metric", "imperial"]).default("metric"),
});

/**
 * @openapi
 * /weather:
 *   get:
 *     summary: Get weather forecast (current + hourly + daily)
 *     description: >
 *       Proxies Open-Meteo for the given coordinates. Results are cached in-memory for 5 minutes.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitude (decimal degrees)
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitude (decimal degrees)
 *       - in: query
 *         name: units
 *         required: false
 *         schema:
 *           type: string
 *           enum: [metric, imperial]
 *         description: Defaults to metric
 *     responses:
 *       200:
 *         description: Weather data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 source:
 *                   type: string
 *                   enum: [cache, open-meteo]
 *                 data:
 *                   description: Raw Open-Meteo response
 *                   type: object
 *       400:
 *         description: Validation error
 *       502:
 *         description: Upstream provider error
 */
router.get("/weather", async (req, res) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { lat, lon, units } = parsed.data as {
    lat: number;
    lon: number;
    units: Units;
  };

  const key = `wx:${lat.toFixed(3)}:${lon.toFixed(3)}:${units}`;
  const cached = getCache<WeatherPayload>(key);
  if (cached) return res.json(cached);

  try {
    const data = await fetchWeather(lat, lon, units);
    const payload: WeatherPayload = { source: "open-meteo", data };
    setCache(key, payload, 5 * 60_000); // 5 minutes
    return res.json(payload);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upstream error";
    return res.status(502).json({ error: msg });
  }
});

export default router;
