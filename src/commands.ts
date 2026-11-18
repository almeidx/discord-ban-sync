import {
	type API,
	type APIChatInputApplicationCommandGuildInteraction,
	type Client,
	GatewayDispatchEvents,
	InteractionType,
	MessageFlags,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	Utils,
} from "@discordjs/core";
import { GUILD_IDS } from "./config.ts";
import { error, info, warn } from "./logger.ts";

export interface Command {
	data: RESTPostAPIChatInputApplicationCommandsJSONBody;
	execute(api: API, interaction: APIChatInputApplicationCommandGuildInteraction): Promise<void>;
}

/** Registers `commandList` globally on login and dispatches their interactions. */
export function registerCommands(client: Client, commandList: readonly Command[]) {
	const commands = new Map(commandList.map((command) => [command.data.name, command]));

	client.on(GatewayDispatchEvents.Ready, async ({ api, data }) => {
		try {
			await api.applicationCommands.bulkOverwriteGlobalCommands(
				data.application.id,
				[...commands.values()].map((command) => command.data),
			);
			info("Registered global slash commands");
		} catch (error_) {
			error("Failed to register global slash commands", error_);
		}
	});

	client.on(GatewayDispatchEvents.InteractionCreate, async ({ api, data }) => {
		if (
			!Utils.isGuildInteraction(data) ||
			!GUILD_IDS.has(data.guild_id) ||
			data.type !== InteractionType.ApplicationCommand ||
			!Utils.isChatInputApplicationCommandInteraction(data)
		) {
			return;
		}

		const interaction = data as APIChatInputApplicationCommandGuildInteraction;
		const name = interaction.data.name;

		try {
			const command = commands.get(name);
			if (command) {
				await command.execute(api, interaction);
			} else {
				warn(`Received unknown command: ${name}`);
				await api.interactions.reply(interaction.id, interaction.token, {
					content: "Unknown command.",
					flags: MessageFlags.Ephemeral,
				});
			}
		} catch (error_) {
			error(`Failed to handle /${name} command`, error_);
			await api.interactions
				.reply(interaction.id, interaction.token, {
					content: "Something went wrong while running this command.",
					flags: MessageFlags.Ephemeral,
				})
				.catch(() => null);
		}
	});
}
