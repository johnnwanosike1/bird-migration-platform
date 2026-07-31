FROM golang:1.26.1-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o main cmd/api/main.go

FROM alpine:3.20.1 AS prod
WORKDIR /app
COPY --from=build /app/main /app/main
EXPOSE ${PORT}
CMD ["./main"]


FROM ghcr.io/pnpm/pnpm:11 AS frontend_builder
RUN pnpm runtime set node 22 -g
WORKDIR /frontend

COPY frontend/package*.json ./
RUN pnpm install
COPY frontend/. .
RUN pnpm run build

FROM node:23-slim AS frontend
RUN npm install -g serve
COPY --from=frontend_builder /frontend/dist /app/dist
EXPOSE 5173
CMD ["serve", "-s", "/app/dist", "-l", "5173"]
