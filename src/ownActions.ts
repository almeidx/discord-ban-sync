import type { Snowflake } from "@discordjs/core";

export type BanAction = "ban" | "unban";

// The gateway echoes every ban/unban the bot makes back to it. Echoes normally arrive within
// seconds of the API call completing; this bounds how long to wait for one that never comes
// (e.g. banning an already-banned user emits no event).
const ECHO_TTL_MS = 120_000;

interface Expectation {
	action: BanAction;
	/** `Infinity` while the API call is in flight: its echo may arrive before the response. */
	expiresAt: number;
}

const expectations = new Map<string, Expectation[]>();

/**
 * Runs `call`, which performs `action` on `userIds` in `guildId` and resolves to the ids it succeeded for.
 * Until their echoes arrive, those events are reported as the bot's own by {@link consumeOwnAction}.
 */
export async function performOwnAction(
	guildId: Snowflake,
	userIds: readonly Snowflake[],
	action: BanAction,
	call: () => Promise<readonly Snowflake[]>,
): Promise<readonly Snowflake[]> {
	pruneExpired();

	const pending = new Map<Snowflake, Expectation>();
	for (const userId of userIds) {
		const expectation: Expectation = { action, expiresAt: Infinity };
		pending.set(userId, expectation);
		listFor(guildId, userId).push(expectation);
	}

	let succeeded: readonly Snowflake[] = [];
	try {
		succeeded = await call();
	} finally {
		const expiresAt = Date.now() + ECHO_TTL_MS;
		for (const userId of succeeded) {
			const expectation = pending.get(userId);
			if (expectation) {
				expectation.expiresAt = expiresAt;
				pending.delete(userId);
			}
		}

		for (const [userId, expectation] of pending) {
			remove(guildId, userId, (candidate) => candidate === expectation);
		}
	}

	return succeeded;
}

/**
 * Whether a gateway ban/unban event is the echo of the bot's own action.
 * Completed expectations of the opposite action that the event supersedes are stale, so they are dropped.
 */
export function consumeOwnAction(guildId: Snowflake, userId: Snowflake, action: BanAction): boolean {
	const list = expectations.get(keyOf(guildId, userId)) ?? [];
	const now = Date.now();
	const matchIndex = list.findIndex((expectation) => expectation.action === action && expectation.expiresAt > now);
	const supersededEnd = matchIndex === -1 ? list.length : matchIndex;

	remove(guildId, userId, (expectation) => {
		const index = list.indexOf(expectation);
		return (
			index === matchIndex ||
			(index < supersededEnd && expectation.action !== action && expectation.expiresAt !== Infinity)
		);
	});
	return matchIndex !== -1;
}

function listFor(guildId: Snowflake, userId: Snowflake): Expectation[] {
	const key = keyOf(guildId, userId);
	let list = expectations.get(key);
	if (!list) {
		list = [];
		expectations.set(key, list);
	}

	return list;
}

function remove(guildId: Snowflake, userId: Snowflake, predicate: (expectation: Expectation) => boolean) {
	const key = keyOf(guildId, userId);
	const remaining = expectations.get(key)?.filter((expectation) => !predicate(expectation));
	if (remaining?.length) {
		expectations.set(key, remaining);
	} else {
		expectations.delete(key);
	}
}

function pruneExpired() {
	const now = Date.now();
	for (const [key, list] of expectations) {
		const live = list.filter((expectation) => expectation.expiresAt > now);
		if (live.length === 0) {
			expectations.delete(key);
		} else if (live.length !== list.length) {
			expectations.set(key, live);
		}
	}
}

function keyOf(guildId: Snowflake, userId: Snowflake) {
	return `${guildId}:${userId}`;
}
