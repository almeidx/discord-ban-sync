import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import { GUILD_IDS } from "#utils/env.js";
import { guilds } from "#utils/guilds.js";

export function registerGuildCreateListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildCreate, ({ data }) => {
		if (!GUILD_IDS.includes(data.id)) {
			return;
		}

		guilds.set(data.id, data.name);
	});
}
