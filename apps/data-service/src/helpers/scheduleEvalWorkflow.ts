import type { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";

export async function scheduleEvalWorkflow(
	env: Env,
	event: LinkClickMessageType,
) {
	const doId = env.EVALUATION_SCHEDULER.idFromName(
		`${event.data.id}:${event.data.destination}`,
	);
	const stub = env.EVALUATION_SCHEDULER.get(doId)
	await stub.collectLinkClick(
		event.data.accountId,
		event.data.id,
		event.data.destination,
		event.data.country || 'UNKNOWN'
	)
}
