import { Client, GatewayIntentBits } from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { registerGuildBanAddListener } from "#listeners/guildBanAdd.js";
import { registerGuildBanRemoveListener } from "#listeners/guildBanRemove.js";
import { registerGuildCreateListener } from "#listeners/guildCreate.js";
import { registerGuildDeleteListener } from "#listeners/guildDelete.js";
import { registerInteractionCreateListener } from "#listeners/interactionCreate.js";
import { registerReadyListener } from "#listeners/ready.js";
import { BanQueue } from "#structures/banQueue.js";
import { DISCORD_TOKEN } from "#utils/env.js";

const rest = new REST().setToken(DISCORD_TOKEN);
const gateway = new WebSocketManager({
	rest,
	intents: GatewayIntentBits.Guilds | GatewayIntentBits.GuildModeration,
	token: DISCORD_TOKEN,
});

const client = new Client({ gateway, rest });

const banQueue = new BanQueue(client.api);

registerReadyListener(client);
registerGuildCreateListener(client);
registerGuildDeleteListener(client);
registerGuildBanAddListener(client, banQueue);
registerGuildBanRemoveListener(client, banQueue);
registerInteractionCreateListener(client);

await gateway.connect();
