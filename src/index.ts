import 'dotenv/config';
import { env, exit } from 'node:process';
import { Client, Events, GatewayIntentBits, Options } from 'discord.js';
import { createGuildBanAddListener } from './listeners/guildBanAdd.js';
import { createGuildBanRemoveListener } from './listeners/guildBanRemove.js';
import { ready } from './listeners/ready.js';
import { BanQueue } from './structures/banQueue.js';
import { SWEEPER_INTERVAL } from './utils/constants.js';
import { fatal } from './utils/logger.js';
import { MESSAGES } from './utils/messages.js';

const REQUIRED_ENV_VARS: string[] = ['DISCORD_TOKEN', 'GUILD_IDS'];
const missingEnvVar = REQUIRED_ENV_VARS.find((envVar) => !env[envVar]);
if (missingEnvVar) {
  fatal(MESSAGES.ENV_VAR_MISSING(missingEnvVar));
  exit(1);
}

const sweeperFilter = () => () => true;

const client = new Client({
  makeCache: Options.cacheWithLimits({
    ApplicationCommandManager: 0,
    BaseGuildEmojiManager: 0,
    GuildBanManager: 10,
    GuildEmojiManager: 0,
    GuildInviteManager: 0,
    GuildMemberManager: 10,
    GuildScheduledEventManager: 0,
    GuildStickerManager: 0,
    MessageManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    ReactionUserManager: 0,
    StageInstanceManager: 0,
    ThreadManager: 0,
    ThreadMemberManager: 0,
    UserManager: 10,
    VoiceStateManager: 0,

    // @ts-expect-error: Untyped managers (but supported)
    ChannelManager: 0,
    GuildChannelManager: 0,
    PermissionOverwriteManager: 0,
    RoleManager: 0,
  }),
  intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildBans,
  sweepers: {
    bans: {
      filter: sweeperFilter,
      interval: SWEEPER_INTERVAL,
    },
    guildMembers: {
      filter: sweeperFilter,
      interval: SWEEPER_INTERVAL,
    },
    users: {
      filter: sweeperFilter,
      interval: SWEEPER_INTERVAL,
    },
  },
});

const banQueue = new BanQueue(client);

client
  .on(Events.ClientReady, ready)
  .on(Events.GuildBanAdd, createGuildBanAddListener(banQueue))
  .on(Events.GuildBanRemove, createGuildBanRemoveListener(banQueue));

await client.login();
