import { type Client, GatewayDispatchEvents, type RESTPostAPIApplicationCommandsJSONBody } from "@discordjs/core";
import { info } from "#utils/logger.js";
import { READY } from "#utils/messages.js";

export function registerReadyListener(client: Client) {
	client.on(GatewayDispatchEvents.Ready, async ({ api, data }) => {
		info(READY(data.user.username));

		const commands = [
			{
				name: "ping",
				description: "Checks the bots ping to the Discord servers",
			},
		] satisfies RESTPostAPIApplicationCommandsJSONBody[];

		await api.applicationCommands.bulkOverwriteGlobalCommands(data.application.id, commands);

		info("Registered global slash commands");
	});
}
