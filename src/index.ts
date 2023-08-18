import { registerGuildBanAddListener } from "#listeners/guildBanAdd.js";
import { registerGuildBanRemoveListener } from "#listeners/guildBanRemove.js";
import { registerGuildCreateListener } from "#listeners/guildCreate.js";
import { registerGuildDeleteListener } from "#listeners/guildDelete.js";
import { registerGuildUpdateListener } from "#listeners/guildUpdate.js";
import { registerInteractionCreateListener } from "#listeners/interactionCreate.js";
import { registerReadyListener } from "#listeners/ready.js";
import { BanQueue } from "#structures/banQueue.js";
import { DISCORD_TOKEN } from "#utils/env.js";
import { Client, GatewayIntentBits } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";

const rest = new REST().setToken(DISCORD_TOKEN);
const gateway = new WebSocketManager({
	rest,
	intents: GatewayIntentBits.Guilds // GUILD_CREATE, GUILD_DELETE, GUILD_UPDATE
		| GatewayIntentBits.GuildModeration, // GUILD_BAN_ADD, GUILD_BAN_REMOVE
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
