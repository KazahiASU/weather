import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Weather API",
      version: "1.0.0",
      description: "Simple Weather backend with geocoding and forecasts",
    },
    servers: [{ url: "http://localhost:3000/v1" }],
    // <- these satisfy the OpenAPI Document type
    paths: {},        // will be filled by swagger-jsdoc scanning JSDoc
    components: {},   // optional, but handy if you add schemas/security later
  },
  // make sure this glob matches your route files
  apis: ["./src/routes/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Raw JSON (useful for client generation / debugging)
  app.get("/docs.json", (_req, res) => {
    res.type("application/json").send(swaggerSpec);
  });
}
