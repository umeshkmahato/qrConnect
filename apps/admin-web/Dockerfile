FROM node:20-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json* ./
COPY apps/admin-web/package.json apps/admin-web/package.json
RUN npm install --workspace apps/admin-web --include-workspace-root=false || npm install
WORKDIR /repo/apps/admin-web
COPY apps/admin-web/ .
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/admin-web/.next/standalone ./
COPY --from=build /repo/apps/admin-web/.next/static ./apps/admin-web/.next/static
CMD ["node", "apps/admin-web/server.js"]
