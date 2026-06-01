<img width="2400" height="600" alt="hero-b" src="https://github.com/user-attachments/assets/54dab058-e884-461c-a17f-0cbf4eafa1a9" />

# Langfuse API Reference

- https://api.reference.langfuse.com
- https://organizations-api.reference.langfuse.com

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

### Run locally

```
npm run dev
```
