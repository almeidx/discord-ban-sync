import 'dotenv/config';

import { env, exit } from 'node:process';
import { Client, Events, GatewayIntentBits } from 'discord.js';

import { createGuildBanAddListener } from './listeners/guildBanAdd.js';
import { createGuildBanRemoveListener } from './listeners/guildBanRemove.js';
import { ready } from './listeners/ready.js';
import { BanQueue } from './structures/banQueue.js';
import { fatal } from './utils/logger.js';
import { MESSAGES } from './utils/messages.js';

const REQUIRED_ENV_VARS: string[] = ['DISCORD_TOKEN', 'GUILD_IDS'];
const missingEnvVar = REQUIRED_ENV_VARS.find((envVar) => !env[envVar]);
if (missingEnvVar) {
  fatal(MESSAGES.ENV_VAR_MISSING(missingEnvVar));
  exit(1);
}

const client = new Client({ intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildBans });
const banQueue = new BanQueue(client);

client
  .on(Events.ClientReady, ready)
  .on(Events.GuildBanAdd, createGuildBanAddListener(banQueue))
  .on(Events.GuildBanRemove, createGuildBanRemoveListener(banQueue));

await client.login();
