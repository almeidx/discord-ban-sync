# Discord Ban Sync

## Table of Contents

- [Discord Ban Sync](#discord-ban-sync)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Local setup](#local-setup)
      - [Cloning repository](#cloning-repository)
      - [Setting up the env variables](#setting-up-the-env-variables)
      - [Running the bot locally](#running-the-bot-locally)
    - [Deployment with PM2](#deployment-with-pm2)
    - [Author](#author)

---

## Overview

This repository houses a bot that automatically synchronizes bans between multiple Discord servers.

---

### Local setup

This setup assumes you have [Git], and [Node.js] setup on your machine. This project requires [Node.js] version 16 or higher, and uses the [Yarn 3] package manager, so you should have basic knowledge about how to use them.

#### Cloning repository

- `git clone git@github.com:almeidx/discord-ban-sync.git`
- `cd discord-ban-sync`
- `yarn`

Note: If you don't have yarn installed globally, you'll have to run `corepack enable`.

#### Setting up the env variables

- `cp .env.example .env`
- Fill out the .env file with your Discord API token and guild ids.

The guild ids should be comma separated, e.g. `GUILD_IDS=493351982887862283,513338222810497041`

#### Running the bot locally

- `yarn start`

---

### Deployment with PM2

- `yarn build`
- `pm2 start ecosystem.config.cjs`

---

### Author

**discord-ban-sync** © [almeidx], released under the [Apache 2.0] license.

> GitHub [@almeidx]

[git]: https://git-scm.com/
[node.js]: https://nodejs.org
[vercel]: https://vercel.com
[yarn 3]: https://yarnpkg.com
[ecosystem.config]: https://github.com/almeidx/discord-ban-sync/blob/main/ecosystem.config.js
[apache 2.0]: https://github.com/almeidx/discord-ban-sync/blob/main/LICENSE
[almeidx]: https://almeidx.dev
[@almeidx]: https://github.com/almeidx
