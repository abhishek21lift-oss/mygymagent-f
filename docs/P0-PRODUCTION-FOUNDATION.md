# P0 Frontend Production Foundation

- The browser must use an explicit production `NEXT_PUBLIC_API_URL`; no localhost fallback is acceptable in production builds.
- Authentication refresh requests use `credentials: include` and must target the configured API origin.
- Production API and frontend origins must be explicitly configured; no wildcard credentialed CORS.
- Build-time public environment variables contain no secrets.
- Production container runs as a non-root user and exposes only the application port to the private deployment network; Nginx is the public entry point.
- Health checks must fail on actual application failure without exposing internal details.
- Tenant context comes from authenticated server state; the frontend must never be treated as the tenant-isolation boundary.
