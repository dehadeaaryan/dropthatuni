FROM oven/bun:1.3.11 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:1.3.11 AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 BODY_SIZE_LIMIT=12M
COPY --from=build /app/build ./build
COPY --from=build /app/package.json /app/bun.lock ./
RUN bun install --production --frozen-lockfile && chown -R bun:bun /app
USER bun
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD bun -e "const response = await fetch('http://127.0.0.1:3000/health'); process.exit(response.ok ? 0 : 1)"
CMD ["bun", "run", "start"]
