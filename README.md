# Discord Ban Sync

## Table of Contents

- [Discord Ban Sync](#discord-ban-sync)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Local setup](#local-setup)
      - [Cloning repository](#cloning-repository)
      - [Setting up the env variables locally](#setting-up-the-env-variables-locally)
      - [Running the bot locally](#running-the-bot-locally)
      - [Updating the bot](#updating-the-bot)
    - [Author](#author)

---

## Overview

This repository houses a bot that automatically synchronizes bans between multiple Discord servers.

---

### Local setup

This setup assumes you have [Git], and [Node.js] setup on your machine. This project requires [Node.js] version 20.17.0
or higher, and uses the [pnpm] package manager, so you should have basic knowledge about how to use them.

#### Cloning repository

- `git clone git@github.com:almeidx/discord-ban-sync.git`
- `cd discord-ban-sync`
- `corepack install`
- `pnpm i`

Note: If you don't have corepack enabled, you can do it with `corepack enable`.

#### Setting up the env variables locally

- `cp .env.example .env`
- Fill out the variables in the .env file

The guild ids should be comma separated, e.g. `GUILD_IDS=493351982887862283,513338222810497041`

#### Running the bot locally

- `pnpm build`

Then:

- if you're using pm2, you can use:
  - `pm2 start ecosystem.config.cjs`

- if your environment variables are stored on the .env file, you can use:
  - `pnpm start:env`

- otherwise, use:
  - `pnpm start`

To check if the bot is working, you can run the `/ping` slash command.

#### Updating the bot

- `git pull`
- `pnpm i`
- `pnpm build`
- Refer to [Running the bot locally] to run the bot again

---

### Author

**discord-ban-sync** © [almeidx], released under the [Apache 2.0] license.

> GitHub [@almeidx]

[git]: https://git-scm.com/
[node.js]: https://nodejs.org
[pnpm]: https://pnpm.io/
[apache 2.0]: https://github.com/almeidx/discord-ban-sync/blob/main/LICENSE
[almeidx]: https://almeidx.dev
[@almeidx]: https://github.com/almeidx
[running the bot locally]: #running-the-bot-locally
