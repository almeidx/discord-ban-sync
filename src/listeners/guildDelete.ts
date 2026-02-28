import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import { guilds } from "#utils/cache.ts";

export function registerGuildDeleteListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildDelete, ({ data }) => {
		guilds.delete(data.id);
	});
}
