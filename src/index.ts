import { Client, GatewayIntentBits } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { registerGuildBanAddListener } from "#listeners/guildBanAdd.ts";
import { registerGuildBanRemoveListener } from "#listeners/guildBanRemove.ts";
import { registerGuildCreateListener } from "#listeners/guildCreate.ts";
import { registerGuildDeleteListener } from "#listeners/guildDelete.ts";
import { registerGuildUpdateListener } from "#listeners/guildUpdate.ts";
import { registerInteractionCreateListener } from "#listeners/interactionCreate.ts";
import { registerReadyListener } from "#listeners/ready.ts";
import { BanQueue } from "#structures/banQueue.ts";
import { DISCORD_TOKEN } from "#utils/env.ts";

const rest = new REST().setToken(DISCORD_TOKEN);
const gateway = new WebSocketManager({
	intents:
		GatewayIntentBits.Guilds | // GUILD_CREATE, GUILD_DELETE, GUILD_UPDATE
		GatewayIntentBits.GuildModeration, // GUILD_BAN_ADD, GUILD_BAN_REMOVE
	rest,
	token: DISCORD_TOKEN,
});

const client = new Client({ gateway, rest });

const banQueue = new BanQueue(client.api);

registerReadyListener(client);
registerGuildCreateListener(client);
registerGuildDeleteListener(client);
registerGuildUpdateListener(client);
registerGuildBanAddListener(client, banQueue);
registerGuildBanRemoveListener(client, banQueue);
registerInteractionCreateListener(client);

await gateway.connect();
