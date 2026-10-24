# NathConnect

QR-based vehicle verification and protected owner-contact platform for verified organizations in India.

## Repository layout

```
apps/
  api/         NestJS backend (versioned REST API under /api/v1, PostgreSQL + Prisma, Redis, BullMQ)
  admin-web/   Next.js administration portal (platform admin + org admin)
  mobile/      Flutter app (Android/iOS, Material 3, English + Hindi)
packages/
  api-contracts/  Shared TypeScript API contract types used by web and generated for mobile
database/    Prisma migrations + seed data (synthetic only)
infrastructure/terraform/  AWS production infrastructure as code
docs/        Architecture, ER diagram, permission matrix, threat model, runbooks
scripts/     Developer tooling
.github/workflows/  CI
```

## Quick start (Docker — recommended)

```bash
cp .env.example .env
docker compose up --build            # postgres + redis + minio + api + admin-web
docker compose --profile seed up seed # optional: synthetic seed data
```

- API: http://localhost:3000 (Swagger at `/api/docs` in non-production)
- Admin web: http://localhost:3001
- MinIO console: http://localhost:9001

## Quick start (local dev)

```bash
docker compose up postgres redis minio minio-init
npm install
npm run db:migrate && npm run db:seed
npm run dev:api      # http://localhost:3000
npm run dev:web      # http://localhost:3001
```

## Tests

```bash
npm run test --workspace apps/api        # unit tests (no DB required)
npm run test:e2e --workspace apps/api    # integration/e2e (requires postgres+redis)
```

See `docs/` for architecture, the role/permission matrix, the QR threat model,
DPDP compliance plan, and operational runbooks.

> Note: Flutter is not built by CI locally unless the Flutter SDK is installed;
> see `apps/mobile/README.md`.
