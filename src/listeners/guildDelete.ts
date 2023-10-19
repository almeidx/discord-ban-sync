import { guilds } from "#utils/guilds.js";
import { type Client, GatewayDispatchEvents } from "@discordjs/core";

export function registerGuildDeleteListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildDelete, ({ data }) => {
		guilds.delete(data.id);
	});
}
