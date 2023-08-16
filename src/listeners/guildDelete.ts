import { GatewayDispatchEvents, type Client } from "@discordjs/core";
import { guilds } from "#utils/guilds.js";

export function registerGuildDeleteListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildDelete, async ({ data }) => {
		guilds.delete(data.id);
	});
}
