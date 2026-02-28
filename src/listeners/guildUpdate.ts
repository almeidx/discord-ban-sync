import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import { guilds } from "#utils/cache.ts";

export function registerGuildUpdateListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildUpdate, ({ data }) => {
		if (guilds.has(data.id)) {
			guilds.set(data.id, { id: data.id, name: data.name });
		}
	});
}
