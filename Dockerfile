# ── Stage 1: Build frontend ────────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ .
RUN npm run build

# ── Stage 2: Build backend with embedded frontend ─────────────────────────────
FROM golang:1.25-alpine AS backend-builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY api/go.mod api/go.sum ./
RUN go mod download

COPY api/ .
COPY --from=frontend-builder /app/dist ./web/dist

RUN CGO_ENABLED=1 GOOS=linux go build -o /rssflow-api .

# ── Stage 3: Runtime ───────────────────────────────────────────────────────────
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=backend-builder /rssflow-api .

EXPOSE 8080
CMD ["./rssflow-api"]
