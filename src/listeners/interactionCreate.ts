import {
	type APIChatInputApplicationCommandGuildInteraction,
	type Client,
	GatewayDispatchEvents,
	InteractionType,
	Utils,
} from "@discordjs/core";
import { pingCommandInteraction } from "#commands/ping.ts";
import { GUILD_IDS } from "#utils/env.ts";

export function registerInteractionCreateListener(client: Client) {
	client.on(GatewayDispatchEvents.InteractionCreate, async ({ api, data }) => {
		if (
			!Utils.isGuildInteraction(data) ||
			!GUILD_IDS.includes(data.guild_id) ||
			data.type !== InteractionType.ApplicationCommand ||
			!Utils.isChatInputApplicationCommandInteraction(data)
		) {
			return;
		}

		if (data.data.name === "ping") {
			await pingCommandInteraction(api, data as APIChatInputApplicationCommandGuildInteraction);
		}
	});
}
