import { env, exit } from "node:process";
import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { createGuildBanAddListener } from "./listeners/guildBanAdd.js";
import { createGuildBanRemoveListener } from "./listeners/guildBanRemove.js";
import { interactionCreate } from "./listeners/interactionCreate.js";
import { ready } from "./listeners/ready.js";
import { BanQueue } from "./structures/banQueue.js";
import { fatal } from "./utils/logger.js";
import { ENV_VAR_MISSING } from "./utils/messages.js";

const REQUIRED_ENV_VARS = ["DISCORD_TOKEN", "GUILD_IDS"] satisfies string[];
const missingEnvVar = REQUIRED_ENV_VARS.find((envVar) => !env[envVar]);
if (missingEnvVar) {
	fatal(ENV_VAR_MISSING(missingEnvVar));
	exit(1);
}

// eslint-disable-next-line unicorn/consistent-function-scoping
const sweeperFilter = () => () => true;
const sweeperInterval = 60 * 60; // 1 hour in seconds

const client = new Client({
	makeCache: Options.cacheWithLimits({
		GuildBanManager: 10,
		GuildMemberManager: 10,
		UserManager: 10,

		ApplicationCommandManager: 0,
		AutoModerationRuleManager: 0,
		BaseGuildEmojiManager: 0,
		GuildEmojiManager: 0,
		GuildForumThreadManager: 0,
		GuildInviteManager: 0,
		GuildScheduledEventManager: 0,
		GuildStickerManager: 0,
		GuildTextThreadManager: 0,
		MessageManager: 0,
		PresenceManager: 0,
		ReactionManager: 0,
		ReactionUserManager: 0,
		StageInstanceManager: 0,
		ThreadManager: 0,
		ThreadMemberManager: 0,
		VoiceStateManager: 0,

		// @ts-expect-error: Untyped (but working) managers
		ChannelManager: 0,
		GuildChannelManager: 0,
		PermissionOverwriteManager: 0,
		RoleManager: 0,
	}),
	intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildModeration,
	sweepers: {
		bans: {
			filter: sweeperFilter,
			interval: sweeperInterval,
		},
		guildMembers: {
			filter: sweeperFilter,
			interval: sweeperInterval,
		},
		users: {
			filter: sweeperFilter,
			interval: sweeperInterval,
		},
	},
});

const banQueue = new BanQueue(client);

client
	.on(Events.ClientReady, ready)
	.on(Events.GuildBanAdd, createGuildBanAddListener(banQueue))
	.on(Events.GuildBanRemove, createGuildBanRemoveListener(banQueue))
	.on(Events.InteractionCreate, interactionCreate);

await client.login();
