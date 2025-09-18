import { Router } from "express";
import { z } from "zod";
import { geocode, reverseGeocode } from "../services/nominatim.js";

const router = Router();

/**
 * @openapi
 * /geocode:
 *   get:
 *     summary: Search a place name to get coordinates
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Free text query, e.g., "Tempe" or "1600 Amphitheatre Pkwy"
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           default: 5
 *     responses:
 *       200:
 *         description: Matching places
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       lat: { type: number }
 *                       lon: { type: number }
 *       400:
 *         description: Validation error
 *       502:
 *         description: Upstream provider error
 */
router.get("/geocode", async (req, res) => {
  // Validate query
  const Query = z.object({
    q: z.string().min(2),
    limit: z.coerce.number().int().min(1).max(10).default(5),
  });

  const parsed = Query.safeParse({
    q: req.query.q,
    limit: req.query.limit,
  });

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const results = await geocode(parsed.data.q);
    // Optionally slice to limit (Nominatim already supports limit param; our service uses 5 by default)
    res.json({ results: results.slice(0, parsed.data.limit) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    res.status(502).json({ error: msg });
  }
});

/**
 * @openapi
 * /reverse-geocode:
 *   get:
 *     summary: Reverse geocode coordinates to a human-readable place
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *     responses:
 *       200:
 *         description: Place info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 place:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     city:
 *                       type: string
 *                       nullable: true
 *                     country:
 *                       type: string
 *                       nullable: true
 *       400:
 *         description: Validation error
 *       502:
 *         description: Upstream provider error
 */
router.get("/reverse-geocode", async (req, res) => {
  const schema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  });

  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const place = await reverseGeocode(parsed.data.lat, parsed.data.lon);
    res.json({ place });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    res.status(502).json({ error: msg });
  }
});

export default router;
