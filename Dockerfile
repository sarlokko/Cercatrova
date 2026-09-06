FROM node:22-bookworm-slim AS build
WORKDIR /app
ARG GIT_SHA=unknown
ENV VITE_GIT_SHA=$GIT_SHA
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
ENV PORT=80 DATA_DIR=/app/data
RUN mkdir -p /app/data && chmod 777 /app/data
EXPOSE 80 8080
CMD ["node", "server/index.mjs"]
