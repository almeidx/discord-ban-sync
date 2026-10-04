FROM node:24.21.0-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN PNPM_VERSION=$(node -p "require('./package.json').packageManager.match(/pnpm@([\d.]+)/)[1]") \
  && npm --global install "pnpm@${PNPM_VERSION}"

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

COPY src ./src

CMD ["node", "src/index.ts"]
