import {
	type Client,
	GatewayDispatchEvents,
	type GatewayGuildCreateDispatchData,
	PermissionFlagsBits,
} from "@discordjs/core";
import { getBotUserId, guilds, unavailableGuildIds } from "#utils/cache.ts";
import { isGuildEnabled } from "#utils/env.ts";
import { info, warn } from "#utils/logger.ts";
import { computePermissionsForMember } from "#utils/permissions.ts";

export function registerGuildCreateListener(client: Client) {
	client.on(GatewayDispatchEvents.GuildCreate, ({ data }) => {
		if (!isGuildEnabled(data.id)) {
			return;
		}

		if (data.unavailable) {
			unavailableGuildIds.add(data.id);
			warn(`${data.id}: guild is unavailable - bans will not sync there until it recovers`);
			return;
		}

		guilds.set(data.id, { id: data.id, name: data.name });

		if (unavailableGuildIds.delete(data.id)) {
			info(`${data.name}: guild is available again`);
		}

		checkBotPermissions(data);
	});
}

function checkBotPermissions({ members, name, roles, id, owner_id: ownerId }: GatewayGuildCreateDispatchData) {
	const botUserId = getBotUserId();
	if (!botUserId) return;

	const botMember = members.find((member) => member.user?.id === botUserId);
	if (!botMember) return;

	const permissions = computePermissionsForMember(botMember.roles, roles, id, ownerId);

	const hasBanMembers = (permissions & PermissionFlagsBits.BanMembers) !== 0n;
	const hasManageGuild = (permissions & PermissionFlagsBits.ManageGuild) !== 0n;

	if (!hasBanMembers) {
		warn(`${name}: bot is missing BAN_MEMBERS permission - ban sync will not work`);
	}

	if (!hasManageGuild) {
		warn(`${name}: bot is missing MANAGE_GUILD permission - bulk ban backfill will not work`);
	}
}
