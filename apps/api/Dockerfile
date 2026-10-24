# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /repo
# workspace manifests first for layer caching
COPY package.json package-lock.json* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
RUN npm install --workspace apps/api --include-workspace-root=false || npm install
WORKDIR /repo/apps/api
COPY apps/api/prisma ./prisma
RUN npx prisma generate
COPY apps/api/tsconfig*.json apps/api/nest-cli.json ./
COPY apps/api/src ./src
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true
WORKDIR /app/apps/api
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/prisma ./prisma
COPY --from=build /repo/apps/api/package.json ./package.json
# apply migrations then start (single-process dev topology; production migrates via CI step)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
