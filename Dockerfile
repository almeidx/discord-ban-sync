FROM node:24.3.0-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apk add --no-cache curl
RUN curl -fsSL https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store source $HOME/.shrc && \
		pnpm install --prod --frozen-lockfile

COPY src ./src

CMD ["node", "src/index.ts"]
