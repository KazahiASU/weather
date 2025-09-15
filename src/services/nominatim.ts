import fetch from "node-fetch";
import { z } from "zod";

/** ---------- Schemas (runtime validation) ---------- */
const SearchItem = z.object({
  display_name: z.string(),
  lat: z.string(),
  lon: z.string(),
});
const SearchArray = z.array(SearchItem);

const ReverseSchema = z.object({
  display_name: z.string(),
  address: z
    .object({
      city: z.string().optional(),
      town: z.string().optional(),
      village: z.string().optional(),
      country: z.string().optional(),
    })
    .partial()
    .optional(),
});

/** ---------- Types inferred from schemas ---------- */
type SearchItem = z.infer<typeof SearchItem>;
type ReverseResult = z.infer<typeof ReverseSchema>;

/** ---------- Forward geocoding (text -> coords) ---------- */
export async function geocode(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
  });

  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    { headers: { "User-Agent": "weather-api-starter/1.0" } }
  );
  if (!r.ok) throw new Error(`Nominatim search error ${r.status}`);

  // r.json() is unknown -> parse to a typed array
  const data = SearchArray.parse(await r.json());
  return data.map((d: SearchItem) => ({
    name: d.display_name,
    lat: Number(d.lat),
    lon: Number(d.lon),
  }));
}

/** ---------- Reverse geocoding (coords -> address) ---------- */
export async function reverseGeocode(lat: number, lon: number) {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "jsonv2",
  });

  const r = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: { "User-Agent": "weather-api-starter/1.0" } }
  );
  if (!r.ok) throw new Error(`Nominatim reverse error ${r.status}`);

  // r.json() is unknown -> parse to a typed object
  const data: ReverseResult = ReverseSchema.parse(await r.json());

  return {
    name: data.display_name,
    city: data.address?.city ?? data.address?.town ?? data.address?.village ?? null,
    country: data.address?.country ?? null,
  };
}
