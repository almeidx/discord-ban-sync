# Discord Ban Sync

A Discord bot that automatically synchronizes bans between multiple Discord servers, ensuring consistent moderation across your server network.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Cloning Repository](#cloning-repository)
  - [Environment Setup](#environment-setup)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Running with Docker](#running-with-docker)
  - [Running Locally](#running-locally)
- [Updating](#updating)
- [Author](#author)

## Features

- ⚡ Real-time ban updates across your Discord servers
- 🔒 Secure and reliable ban management
- 🛠️ Easy setup and configuration

## Prerequisites

Before you begin, ensure you have the following installed:
- [Git]
- [Node.js] (v24.1.0 or higher)
- [pnpm] (v10.11.0 or higher)
- [Docker] (optional, for containerized deployment)
- [PM2] (optional, for process management)

## Installation

### Cloning Repository

This assumes you already have Corepack enabled on your system. If you don't, you can enable it using `corepack enable`,
as it comes preinstalled with [Node.js].

```bash
git clone git@github.com:almeidx/discord-ban-sync.git
cd discord-ban-sync
```

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in the `.env` file
## Configuration

| Variable                 | Description                                                                | Example                                 | Required |
|--------------------------|----------------------------------------------------------------------------|-----------------------------------------|----------|
| `DISCORD_TOKEN`          | Your Discord bot token                                                     | `your-bot-token-here`                   | Yes      |
| `GUILD_IDS`              | Comma/Newline-separated list of server IDs                                 | `123456789012345678,123456789012345678` | Yes      |
| `DELETE_MESSAGE_SECONDS` | Amount of seconds of messages to delete from users when banning (0-604800) | `604800` (7 days)                       | No       |

## Usage

### Running with Docker

The easiest way to run the bot is using Docker. You have two options:

#### Option 1: Using Docker Compose

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Configure your environment variables in the `.env` file

3. Start the bot:
```bash
docker compose up -d
```

4. View logs:
```bash
docker compose logs -f
```

5. Stop the bot:
```bash
docker compose down
```

#### Option 2: Using Docker directly

1. Pull the latest image:
```bash
docker pull ghcr.io/almeidx/discord-ban-sync:latest
```

2. Run the container with environment variables:
```bash
docker run -d \
  --name discord-ban-sync \
  -e DISCORD_TOKEN=your-bot-token-here \
  -e GUILD_IDS=123456789012345678,987654321098765432 \
  -e DELETE_MESSAGE_SECONDS=604800 \ # Optional
  ghcr.io/almeidx/discord-ban-sync:latest
```

3. View logs:
```bash
docker logs -f discord-ban-sync
```

4. Stop the container:
```bash
docker stop discord-ban-sync
docker rm discord-ban-sync
```

### Running locally

First off, setup the environment:

If you don't have Corepack enabled, you can do it using `corepack enable`, as it comes preinstall with [Node.js].

```bash
corepack install
pnpm install --frozen-lockfile
```

#### Directly

```bash
node --run start
```

#### PM2

```bash
pm2 start ecosystem.config.cjs
```

To verify the bot is working, use the `/ping` slash command in your Discord server.

## Updating

To update the bot to the latest version:

```bash
git pull --rebase
pnpm install --frozen-lockfile
```

Then restart the bot using your preferred method (local, Docker, or PM2).

### Author

**discord-ban-sync** © [almeidx], released under the [Apache 2.0] license.

> GitHub [@almeidx]

[git]: https://git-scm.com/
[node.js]: https://nodejs.org
[pnpm]: https://pnpm.io/
[docker]: https://www.docker.com/
[pm2]: https://pm2.keymetrics.io/
[apache 2.0]: https://github.com/almeidx/discord-ban-sync/blob/main/LICENSE
[almeidx]: https://almeidx.dev
[@almeidx]: https://github.com/almeidx
[running the bot locally]: #running-the-bot-locally
