import { type API, RESTJSONErrorCodes, type Snowflake } from "@discordjs/core";
import { DiscordAPIError } from "@discordjs/rest";
import { ellipsis, getGuildIdentifier } from "#utils/common.js";
import { DELETE_MESSAGE_SECONDS, GUILD_IDS } from "#utils/env.js";
import { error, info, warn } from "#utils/logger.js";
import {
	BAN_NO_REASON,
	BAN_REASON,
	MAX_NON_MEMBER_BANS_REACHED,
	UNBAN_NO_REASON,
	UNBAN_REASON,
} from "#utils/messages.js";
import { removeRecentBan, removeRecentUnban } from "#utils/recentBans.js";

const enum BanType {
	Ban = 0,
	Unban = 1,
}

interface BanInfo {
	guildId: Snowflake;
	reason: string | null | undefined;
	type: BanType;
	userId: Snowflake;
}

export class BanQueue {
	#queueLock = false;

	readonly #queue: BanInfo[] = [];

	public constructor(private readonly api: API) {}

	public queueBan(guildId: Snowflake, userId: Snowflake, reason: string | null | undefined): void {
		this.#queue.push({ guildId, userId, reason, type: BanType.Ban });

		void this.#processQueue();
	}

	public queueUnban(guildId: Snowflake, userId: Snowflake, reason: string | null | undefined): void {
		this.#queue.push({ guildId, userId, reason, type: BanType.Unban });

		void this.#processQueue();
	}

	async #processQueue(): Promise<void> {
		if (this.#queueLock || this.#queue.length === 0) {
			return;
		}

		this.#queueLock = true;

		// This will always exist because of the length check at the beginning
		const banInfo = this.#queue.shift()!;
		const reason = this.#resolveReason(banInfo);

		let actionsTaken = 0;

		try {
			for (const guildId of GUILD_IDS) {
				// Skip the guild where the ban/unban happened
				if (guildId === banInfo.guildId) {
					continue;
				}

				if (banInfo.type === BanType.Ban) {
					const success = await this.#banUser(guildId, banInfo.userId, reason);
					if (success) actionsTaken++;
				} else {
					const success = await this.#unbanUser(guildId, banInfo.userId, reason);
					if (success) actionsTaken++;
				}
			}
		} catch (error_) {
			error(error_);
		} finally {
			if (banInfo.type === BanType.Ban) {
				removeRecentBan(banInfo.userId);
			} else {
				removeRecentUnban(banInfo.userId);
			}

			info(`Processed ${actionsTaken} actions for ${banInfo.userId}`);

			this.#queueLock = false;

			void this.#processQueue();
		}
	}

	#resolveReason({ guildId, reason, type }: BanInfo): string {
		let msg: string;

		const guildIdentifier = getGuildIdentifier(guildId);

		if (type === BanType.Ban) {
			if (reason) {
				msg = BAN_REASON(guildIdentifier, reason);
			} else {
				msg = BAN_NO_REASON(guildIdentifier);
			}
		} else if (reason) {
			msg = UNBAN_REASON(guildIdentifier, reason);
		} else {
			msg = UNBAN_NO_REASON(guildIdentifier);
		}

		return ellipsis(msg, 0, 512);
	}

	async #banUser(guildId: Snowflake, userId: Snowflake, reason: string): Promise<boolean> {
		try {
			await this.api.guilds.banUser(guildId, userId, { delete_message_seconds: DELETE_MESSAGE_SECONDS }, { reason });

			return true;
		} catch (error_) {
			if (
				error_ instanceof DiscordAPIError &&
				error_.code === RESTJSONErrorCodes.MaximumNumberOfNonGuildMemberBansHasBeenExceeded
			) {
				// TODO: Disable ban queue in this guild until the day is over/after one day has passed

				warn(MAX_NON_MEMBER_BANS_REACHED(getGuildIdentifier(guildId)));
				return false;
			}

			throw error_;
		}
	}

	async #unbanUser(guildId: Snowflake, userId: Snowflake, reason: string): Promise<boolean> {
		try {
			await this.api.guilds.unbanUser(guildId, userId, { reason });

			return true;
		} catch (error_) {
			if (error_ instanceof DiscordAPIError && error_.code === RESTJSONErrorCodes.UnknownBan) {
				// User was not banned in this guild, ignore
				return false;
			}

			throw error_;
		}
	}
}
