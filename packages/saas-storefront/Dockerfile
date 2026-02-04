FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare yarn@3.2.1 --activate
COPY . .
RUN yarn install
RUN yarn workspace saas-storefront build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["yarn", "workspace", "saas-storefront", "start"]
