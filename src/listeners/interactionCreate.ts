import { pingCommandInteraction } from "#commands/ping.js";
import { GUILD_IDS } from "#utils/env.js";
import { type Client, GatewayDispatchEvents, InteractionType } from "@discordjs/core";
import { isChatInputApplicationCommandInteraction, isGuildInteraction } from "discord-api-types/utils/v10";

export function registerInteractionCreateListener(client: Client) {
	client.on(GatewayDispatchEvents.InteractionCreate, async ({ api, data }) => {
		if (
			!isGuildInteraction(data)
			|| !GUILD_IDS.includes(data.guild_id)
			|| data.type !== InteractionType.ApplicationCommand
			|| !isChatInputApplicationCommandInteraction(data)
		) {
			return;
		}

		if (data.data.name === "ping") {
			await pingCommandInteraction(api, data);
		}
	});
}
