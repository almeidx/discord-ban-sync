import { GatewayDispatchEvents, InteractionType, type Client } from "@discordjs/core";
import { isChatInputApplicationCommandInteraction, isGuildInteraction } from "discord-api-types/utils/v10";
import { pingCommandInteraction } from "#commands/ping.js";
import { GUILD_IDS } from "#utils/env.js";

export function registerInteractionCreateListener(client: Client) {
	client.on(GatewayDispatchEvents.InteractionCreate, async ({ api, data }) => {
		if (
			!isGuildInteraction(data) ||
			!GUILD_IDS.includes(data.guild_id) ||
			data.type !== InteractionType.ApplicationCommand ||
			!isChatInputApplicationCommandInteraction(data)
		) {
			return;
		}

		if (data.data.name === "ping") {
			await pingCommandInteraction(api, data);
		}
	});
}
