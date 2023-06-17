import type { Interaction } from "discord.js";
import { pingCommandInteraction } from "../commands/ping.js";

export async function interactionCreate(interaction: Interaction): Promise<void> {
	if (!interaction.inCachedGuild()) return;

	if (interaction.isChatInputCommand() && interaction.commandName === "ping") {
		await pingCommandInteraction(interaction);
	}
}
