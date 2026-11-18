import { Client, GatewayDispatchEvents, GatewayIntentBits } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { backfillBansCommand, backfillStatusCommand, registerBackfill } from "./backfill.ts";
import { registerCommands } from "./commands.ts";
import { DISCORD_TOKEN } from "./config.ts";
import { registerGuildTracking } from "./guilds.ts";
import { registerLiveSync } from "./liveSync.ts";
import { error, info } from "./logger.ts";
import { pingCommand } from "./ping.ts";

process.on("unhandledRejection", (reason) => {
	error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error_) => {
	error("Uncaught exception, exiting", error_);
	process.exit(1);
});

const rest = new REST().setToken(DISCORD_TOKEN);
const gateway = new WebSocketManager({
	intents:
		GatewayIntentBits.Guilds | // GUILD_CREATE, GUILD_DELETE, GUILD_UPDATE
		GatewayIntentBits.GuildModeration, // GUILD_BAN_ADD, GUILD_BAN_REMOVE
	token: DISCORD_TOKEN,
});

const client = new Client({ gateway, rest });
const botUser = await client.api.users.getCurrent();

client.on(GatewayDispatchEvents.Ready, ({ data }) => {
	info(`Logged in as ${data.user.username}`);
});

registerGuildTracking(client, botUser.id);
registerLiveSync(client);
registerBackfill(client);
registerCommands(client, [pingCommand, backfillBansCommand, backfillStatusCommand]);

await gateway.connect({
	gatewayInformation: await client.api.gateway.getBot(),
});
