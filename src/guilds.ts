import {
	type Client,
	GatewayDispatchEvents,
	type GatewayGuildCreateDispatchData,
	PermissionFlagsBits,
	type Snowflake,
} from "@discordjs/core";
import { GUILD_IDS } from "./config.ts";
import { info, warn } from "./logger.ts";

const names = new Map<Snowflake, string>();
const unavailable = new Set<Snowflake>();

/** The guild's name once the gateway has delivered it, otherwise its id. */
export function guildName(guildId: Snowflake): string {
	return names.get(guildId) ?? guildId;
}

export function registerGuildTracking(client: Client, botUserId: Snowflake) {
	client.on(GatewayDispatchEvents.Ready, ({ data }) => {
		const joined = new Set(data.guilds.map((guild) => guild.id));
		const missing = [...GUILD_IDS].filter((guildId) => !joined.has(guildId));
		if (missing.length > 0) {
			warn(`Bot is not in ${missing.length} configured guild(s) - bans will not sync there: ${missing.join(", ")}`);
		}
	});

	client.on(GatewayDispatchEvents.GuildCreate, ({ data }) => {
		if (!GUILD_IDS.has(data.id)) return;

		if (data.unavailable) {
			unavailable.add(data.id);
			warn(`${data.id}: guild is unavailable - bans will not sync there until it recovers`);
			return;
		}

		names.set(data.id, data.name);

		if (unavailable.delete(data.id)) {
			info(`${data.name}: guild is available again`);
		}

		warnMissingPermissions(data, botUserId);
	});

	client.on(GatewayDispatchEvents.GuildDelete, ({ data }) => {
		if (GUILD_IDS.has(data.id)) {
			const name = guildName(data.id);
			if (data.unavailable) {
				unavailable.add(data.id);
				warn(`${name}: guild became unavailable - bans will not sync there until it recovers`);
			} else {
				warn(`${name}: bot was removed from the guild - bans will not sync there`);
			}
		}

		names.delete(data.id);
	});

	client.on(GatewayDispatchEvents.GuildUpdate, ({ data }) => {
		if (names.has(data.id)) {
			names.set(data.id, data.name);
		}
	});
}

function warnMissingPermissions(guild: GatewayGuildCreateDispatchData, botUserId: Snowflake) {
	const botMember = guild.members.find((member) => member.user?.id === botUserId);
	if (!botMember) return;

	const permissions = computeBasePermissions(guild, botUserId, botMember.roles);

	if ((permissions & PermissionFlagsBits.BanMembers) === 0n) {
		warn(`${guild.name}: bot is missing BAN_MEMBERS permission - ban sync will not work`);
	}

	if ((permissions & PermissionFlagsBits.ManageGuild) === 0n) {
		warn(`${guild.name}: bot is missing MANAGE_GUILD permission - bulk ban backfill will not work`);
	}
}

function computeBasePermissions(
	guild: GatewayGuildCreateDispatchData,
	userId: Snowflake,
	memberRoleIds: Snowflake[],
): bigint {
	if (userId === guild.owner_id) return ~0n;

	const everyoneRole = guild.roles.find((role) => role.id === guild.id);
	let permissions = BigInt(everyoneRole?.permissions ?? "0");

	for (const roleId of memberRoleIds) {
		const role = guild.roles.find((r) => r.id === roleId);
		if (role) {
			permissions |= BigInt(role.permissions);
		}
	}

	return (permissions & PermissionFlagsBits.Administrator) === 0n ? permissions : ~0n;
}
