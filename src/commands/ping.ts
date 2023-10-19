import { type API, type APIChatInputApplicationCommandGuildInteraction, MessageFlags } from "@discordjs/core";
import ms from "pretty-ms";
import { getTimestampFromSnowflake } from "#utils/common.js";

export async function pingCommandInteraction(
	api: API,
	interaction: APIChatInputApplicationCommandGuildInteraction,
): Promise<void> {
	await api.interactions.defer(interaction.id, interaction.token, { flags: MessageFlags.Ephemeral });

	const reply = await api.interactions.getOriginalReply(interaction.application_id, interaction.token);

	const latency = ms(getTimestampFromSnowflake(reply.id) - getTimestampFromSnowflake(interaction.id));

	await api.interactions.editReply(interaction.application_id, interaction.token, {
		content: `Latency: **${latency}**`,
	});
}
