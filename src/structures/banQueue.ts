import { RESTJSONErrorCodes, type Client, type Guild, type GuildBan, type Snowflake } from "discord.js";
import { Time, ellipsis, isDiscordAPIError, parseDeleteMessageDays } from "../utils/common.js";
import { GUILD_IDS } from "../utils/constants.js";
import { error, info, warn } from "../utils/logger.js";
import {
	BAN_NO_REASON,
	BAN_REASON,
	GUILD_NOT_FOUND,
	MAX_NON_MEMBER_BANS_REACHED,
	UNBAN_NO_REASON,
	UNBAN_REASON,
} from "../utils/messages.js";
import { removeRecentBan, removeRecentUnban } from "../utils/recentBans.js";

const enum BanType {
	Ban,
	Unban,
}

interface BanInfo {
	guild: Guild;
	reason: GuildBan["reason"];
	type: BanType;
	userId: Snowflake;
}

export class BanQueue {
	#queueLock = false;

	readonly #queue: BanInfo[] = [];

	readonly #deleteMessageDays: number = parseDeleteMessageDays();

	public constructor(private readonly client: Client<true>) {}

	public queueBan({ guild, reason, user }: GuildBan): void {
		this.#queue.push({ guild, reason, userId: user.id, type: BanType.Ban });

		void this.#processQueue();
	}

	public queueUnban({ guild, reason, user }: GuildBan): void {
		this.#queue.push({ guild, reason, userId: user.id, type: BanType.Unban });

		void this.#processQueue();
	}

	async #processQueue(): Promise<void> {
		if (this.#queueLock || this.#queue.length === 0) {
			return;
		}

		this.#queueLock = true;

		// This will always exist because of the length check at the beginning
		const banInfo = this.#queue.shift()!;

		let actionsTaken = 0;

		try {
			const reason = this.#resolveReason(banInfo);

			for (const guildId of GUILD_IDS) {
				// Skip the guild where the ban/unban happened
				if (guildId === banInfo.guild.id) {
					continue;
				}

				const guild = this.client.guilds.cache.get(guildId);
				if (!guild) {
					warn(GUILD_NOT_FOUND(banInfo.userId, guildId));
					continue;
				}

				if (banInfo.type === BanType.Ban) {
					const success = await this.#banUser(guild, banInfo.userId, reason);
					if (success) actionsTaken++;
				} else {
					const success = await this.#unbanUser(guild, banInfo.userId, reason);
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

	#resolveReason({ guild, reason, type }: BanInfo): string {
		let msg: string;

		if (type === BanType.Ban) {
			if (reason) {
				msg = BAN_REASON(guild.name, reason);
			} else {
				msg = BAN_NO_REASON(guild.name);
			}
		} else if (reason) {
			msg = UNBAN_REASON(guild.name, reason);
		} else {
			msg = UNBAN_NO_REASON(guild.name);
		}

		return ellipsis(msg, 0, 512);
	}

	async #banUser(guild: Guild, userId: Snowflake, reason: string): Promise<boolean> {
		try {
			await guild.bans.create(userId, { deleteMessageSeconds: this.#deleteMessageDays * Time.Day, reason });
			return true;
		} catch (error_) {
			if (
				isDiscordAPIError(error_) &&
				error_.code === RESTJSONErrorCodes.MaximumNumberOfNonGuildMemberBansHasBeenExceeded
			) {
				// TODO: Disable ban queue in this guild until the day is over/after one day has passed

				warn(MAX_NON_MEMBER_BANS_REACHED(guild.name));
				return false;
			}

			throw error_;
		}
	}

	async #unbanUser(guild: Guild, userId: Snowflake, reason: string): Promise<boolean> {
		try {
			await guild.bans.remove(userId, reason);
			return true;
		} catch (error_) {
			if (isDiscordAPIError(error_) && error_.code === RESTJSONErrorCodes.UnknownBan) {
				// User was not banned in this guild, ignore
				return false;
			}

			throw error_;
		}
	}
}
