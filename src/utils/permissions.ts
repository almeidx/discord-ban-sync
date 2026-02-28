import { type APIRole, PermissionFlagsBits, type Snowflake } from "@discordjs/core";
import { getBotUserId } from "#utils/cache.ts";

export function computePermissionsForMember(
	memberRoleIds: Snowflake[],
	guildRoles: APIRole[],
	guildId: Snowflake,
	ownerId: Snowflake,
): bigint {
	if (getBotUserId() === ownerId) return ~0n;

	const everyoneRole = guildRoles.find((r) => r.id === guildId);
	let permissions = BigInt(everyoneRole?.permissions ?? "0");

	for (const roleId of memberRoleIds) {
		const role = guildRoles.find((r) => r.id === roleId);
		if (role) {
			permissions |= BigInt(role.permissions);
		}
	}

	if ((permissions & PermissionFlagsBits.Administrator) !== 0n) {
		return ~0n;
	}

	return permissions;
}
