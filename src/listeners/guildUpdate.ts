import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import { guilds } from "#utils/guilds.js";

export function registerGuildUpdateListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildUpdate, ({ data }) => {
		const guild = guilds.get(data.id);

		if (guild) {
			guilds.set(data.id, data.name);
		}
	});
}
