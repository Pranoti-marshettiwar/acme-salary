FROM node:22-alpine AS ui
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npx ng build

FROM node:22-alpine
WORKDIR /app/backend
ENV NODE_ENV=production STATIC_DIR=/app/frontend/dist/frontend/browser
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend ./
COPY --from=ui /app/frontend/dist/frontend/browser /app/frontend/dist/frontend/browser
EXPOSE 4000
CMD ["node", "src/server.js"]
