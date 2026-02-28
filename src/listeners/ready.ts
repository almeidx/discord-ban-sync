import {
	type Client,
	GatewayDispatchEvents,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody,
} from "@discordjs/core";
import { setBotUserId } from "#utils/cache.ts";
import { info } from "#utils/logger.ts";

export function registerReadyListener(client: Client) {
	client.on(GatewayDispatchEvents.Ready, async ({ api, data }) => {
		info(`Logged in as ${data.user.username}`);

		setBotUserId(data.user.id);

		const commands = [
			{
				description: "Checks the bots ping to the Discord servers",
				name: "ping",
			},
			{
				default_member_permissions: PermissionFlagsBits.Administrator.toString(),
				description: "Starts a one-time historical ban sync across all configured guilds",
				name: "backfill-bans",
			},
			{
				default_member_permissions: PermissionFlagsBits.Administrator.toString(),
				description: "Shows the current backfill progress or last run results",
				name: "backfill-status",
			},
		] satisfies RESTPostAPIApplicationCommandsJSONBody[];

		await api.applicationCommands.bulkOverwriteGlobalCommands(data.application.id, commands);

		info("Registered global slash commands");
	});
}
