![GitHub Banner](https://github.com/langfuse/langfuse-api-reference/assets/2834609/8cb3c6ce-d62b-4dae-8e29-44e317a7abeb)

# Langfuse API Reference

https://api.reference.langfuse.com

## Deployment

This repository contains a simple static site that renders an OpenAPI specification using [Scalar](https://github.com/scalar/scalar). By default, it renders the Langfuse API specification from `https://cloud.langfuse.com/generated/api/openapi.yml`.

### Deploy with a custom OpenAPI specification

You can deploy this repository to render any OpenAPI specification by setting the `APISPEC_DATA_URL` environment variable in your Vercel deployment:

1. Fork this repository
2. Create a new Vercel project from your fork
3. Set the `APISPEC_DATA_URL` environment variable to point to your OpenAPI specification URL
4. Deploy

Example environment variable:

```
APISPEC_DATA_URL=https://example.com/path/to/your/openapi.yml
```
