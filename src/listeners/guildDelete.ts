import { type Client, GatewayDispatchEvents } from "@discordjs/core";
import { guilds, unavailableGuildIds } from "#utils/cache.ts";
import { getGuildIdentifier } from "#utils/common.ts";
import { isGuildEnabled } from "#utils/env.ts";
import { warn } from "#utils/logger.ts";

export function registerGuildDeleteListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildDelete, ({ data }) => {
		if (isGuildEnabled(data.id)) {
			const name = getGuildIdentifier(data.id);
			if (data.unavailable) {
				unavailableGuildIds.add(data.id);
				warn(`${name}: guild became unavailable - bans will not sync there until it recovers`);
			} else {
				warn(`${name}: bot was removed from the guild - bans will not sync there`);
			}
		}

		guilds.delete(data.id);
	});
}
