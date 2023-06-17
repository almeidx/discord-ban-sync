import type { Client, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { info } from "../utils/logger.js";
import { READY } from "../utils/messages.js";

export async function ready(client: Client<true>): Promise<void> {
	info(READY(client.user.tag));

	const commands = [
		{
			name: "ping",
			description: "Checks the bots ping to the Discord servers",
		},
	] satisfies RESTPostAPIApplicationCommandsJSONBody[];

	await client.application.commands.set(commands);
}
