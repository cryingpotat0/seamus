FROM node:18.12-alpine AS build-stage
WORKDIR /app
COPY package.json .
RUN corepack enable pnpm
RUN pnpm install
COPY . .
RUN pnpm run build

FROM nginx:latest
WORKDIR /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist .
