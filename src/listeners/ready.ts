import type { Client } from 'discord.js';
import { info } from '../utils/logger.js';
import { MESSAGES } from '../utils/messages.js';

export function ready(client: Client<true>) {
  info(MESSAGES.READY(client.user.tag));
}
