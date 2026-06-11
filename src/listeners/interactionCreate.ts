import {
	type APIChatInputApplicationCommandGuildInteraction,
	type Client,
	GatewayDispatchEvents,
	InteractionType,
	MessageFlags,
	Utils,
} from "@discordjs/core";
import { backfillBansCommandInteraction, backfillStatusCommandInteraction } from "#commands/backfillBans.ts";
import { pingCommandInteraction } from "#commands/ping.ts";
import { isGuildEnabled } from "#utils/env.ts";
import { error, warn } from "#utils/logger.ts";

export function registerInteractionCreateListener(client: Client) {
	client.on(GatewayDispatchEvents.InteractionCreate, async ({ api, data }) => {
		if (
			!Utils.isGuildInteraction(data) ||
			!isGuildEnabled(data.guild_id) ||
			data.type !== InteractionType.ApplicationCommand ||
			!Utils.isChatInputApplicationCommandInteraction(data)
		) {
			return;
		}

		const interaction = data as APIChatInputApplicationCommandGuildInteraction;

		try {
			if (data.data.name === "ping") {
				await pingCommandInteraction(api, interaction);
			} else if (data.data.name === "backfill-bans") {
				await backfillBansCommandInteraction(api, interaction);
			} else if (data.data.name === "backfill-status") {
				await backfillStatusCommandInteraction(api, interaction);
			} else {
				warn(`Received unknown command: ${data.data.name}`);
				await api.interactions.reply(interaction.id, interaction.token, {
					content: "Unknown command.",
					flags: MessageFlags.Ephemeral,
				});
			}
		} catch (error_) {
			error(`Failed to handle /${data.data.name} command`, error_);
			await api.interactions
				.reply(interaction.id, interaction.token, {
					content: "Something went wrong while running this command.",
					flags: MessageFlags.Ephemeral,
				})
				.catch(() => null);
		}
	});
}
