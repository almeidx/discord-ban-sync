import {
	type Client,
	GatewayDispatchEvents,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody,
} from "@discordjs/core";
import { setBotUserId } from "#utils/cache.ts";
import { GUILD_IDS } from "#utils/env.ts";
import { error, info, warn } from "#utils/logger.ts";

export function registerReadyListener(client: Client) {
	client.on(GatewayDispatchEvents.Ready, async ({ api, data }) => {
		info(`Logged in as ${data.user.username}`);

		setBotUserId(data.user.id);

		const joinedGuildIds = data.guilds.map((guild) => guild.id);
		const missingGuildIds = [...GUILD_IDS].filter((guildId) => !joinedGuildIds.includes(guildId));
		if (missingGuildIds.length > 0) {
			warn(
				`Bot is not in ${missingGuildIds.length} configured guild(s) - bans will not sync there: ${missingGuildIds.join(", ")}`,
			);
		}

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

		try {
			await api.applicationCommands.bulkOverwriteGlobalCommands(data.application.id, commands);
			info("Registered global slash commands");
		} catch (error_) {
			error("Failed to register global slash commands", error_);
		}
	});
}
