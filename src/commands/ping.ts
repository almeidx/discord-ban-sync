import ms from "@almeidx/ms";
import type { ChatInputCommandInteraction } from "discord.js";

export async function pingCommandInteraction(interaction: ChatInputCommandInteraction<"cached">): Promise<void> {
	const message = await interaction.deferReply({ ephemeral: true, fetchReply: true });

	const heartbeat = ms(interaction.client.ws.ping);
	const latency = ms(message.createdTimestamp - interaction.createdTimestamp);

	await interaction.editReply({
		content: `Heartbeat: **${heartbeat}**\nLatency: **${latency}**`,
	});
}
