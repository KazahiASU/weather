declare module "swagger-jsdoc" {
  import { OpenAPIV3 } from "openapi-types";

  namespace swaggerJsdoc {
    interface Options {
      definition: OpenAPIV3.Document;
      apis: string[];
    }
  }

  function swaggerJsdoc(options: swaggerJsdoc.Options): OpenAPIV3.Document;
  export = swaggerJsdoc;
}
