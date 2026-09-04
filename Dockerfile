FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
ENV PORT=80 DATA_DIR=/app/data
RUN mkdir -p /app/data && chmod 777 /app/data
EXPOSE 80 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD node -e "Promise.any([80,8080].map(p=>fetch('http://127.0.0.1:'+p+'/api/health'))).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]
