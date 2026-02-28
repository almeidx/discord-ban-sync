import {
	type APIChatInputApplicationCommandGuildInteraction,
	type Client,
	GatewayDispatchEvents,
	InteractionType,
	Utils,
} from "@discordjs/core";
import { backfillBansCommandInteraction, backfillStatusCommandInteraction } from "#commands/backfillBans.ts";
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

		const interaction = data as APIChatInputApplicationCommandGuildInteraction;

		if (data.data.name === "ping") {
			await pingCommandInteraction(api, interaction);
		} else if (data.data.name === "backfill-bans") {
			await backfillBansCommandInteraction(api, interaction);
		} else if (data.data.name === "backfill-status") {
			await backfillStatusCommandInteraction(api, interaction);
		}
	});
}
