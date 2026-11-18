import { MessageFlags, type Snowflake } from "@discordjs/core";
import ms from "pretty-ms";
import type { Command } from "./commands.ts";

const DISCORD_EPOCH_MS = 1_420_070_400_000n;

export const pingCommand: Command = {
	data: {
		description: "Checks the bots ping to the Discord servers",
		name: "ping",
	},
	async execute(api, interaction) {
		await api.interactions.defer(interaction.id, interaction.token, { flags: MessageFlags.Ephemeral });

		const reply = await api.interactions.getOriginalReply(interaction.application_id, interaction.token);
		const latency = ms(snowflakeTimestamp(reply.id) - snowflakeTimestamp(interaction.id));

		await api.interactions.editReply(interaction.application_id, interaction.token, {
			content: `Latency: **${latency}**`,
		});
	},
};

function snowflakeTimestamp(snowflake: Snowflake): number {
	return Number((BigInt(snowflake) >> 22n) + DISCORD_EPOCH_MS);
}
