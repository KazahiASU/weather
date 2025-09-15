import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import geoRouter from "./routes/geocode.js";
import { setupSwagger } from "./swagger.js";
import weatherRouter from "./routes/weather.js";




const app = express();
app.use("/v1", weatherRouter); //wire up the routes
app.use("/v1", geoRouter);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
// ...
app.use("/v1", weatherRouter);
app.use("/v1", geoRouter);
// Rate-limit: 60 req/min per IP
const limiter = rateLimit({ windowMs: 60_000, max: 60 });
app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

setupSwagger(app);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✓ Weather API running on :${PORT}`);
});
