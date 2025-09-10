import { addLinkClick } from "@repo/data-ops/queries/links";
import type { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";

export async function handleLinkClick(env: Env, event: LinkClickMessageType) {
	await addLinkClick(event.data);
}
