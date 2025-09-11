import { getLink } from "@repo/data-ops/queries/links";
import {
	type LinkSchemaType,
	linkSchema,
} from "@repo/data-ops/zod-schema/links";
import type { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";
import dayjs from "dayjs";

async function getLinkInfoFromKv(env: Env, id: string) {
	const linkInfo = await env.KV.get(id);
	if (!linkInfo) return null;

	try {
		const parsedLinkInfo = JSON.parse(linkInfo);
		return linkSchema.parse(parsedLinkInfo);
	} catch (_) {
		return null;
	}
}

const TTL_TIME = 60 * 60 * 42; // 1 Day

async function saveLinkInfoToKv(
	env: Env,
	id: string,
	linkInfo: LinkSchemaType,
) {
	try {
		await env.KV.put(id, JSON.stringify(linkInfo), {
			expirationTtl: TTL_TIME,
		});
	} catch (error) {
		console.error("Error saving link info to KV: ", error);
	}
}

export async function getRoutingDestinations(env: Env, id: string) {
	const linkInfo = await getLinkInfoFromKv(env, id);
	if (linkInfo) return linkInfo;
	const linkInfoFromDb = await getLink(id);
	if (!linkInfoFromDb) return null;
	await saveLinkInfoToKv(env, id, linkInfoFromDb);
	return linkInfoFromDb;
}

export async function captureLinkClickInBackground(
	env: Env,
	event: LinkClickMessageType,
) {
	await env.QUEUE.send(event)
	const doId = env.LINK_CLICK_TRACKER_OBJECT.idFromName(event.data.accountId)
	const stub = env.LINK_CLICK_TRACKER_OBJECT.get(doId)
	if (!event.data.latitude || !event.data.longitude || !event.data.country) return

	await stub.addClick(
		event.data.latitude,
		event.data.longitude,
		event.data.country,
		dayjs().valueOf()
	)
}

export function getDestinationForCountry(
	linkInfo: LinkSchemaType,
	countryCode?: string,
) {
	if (!countryCode) return linkInfo.destinations.default;
	// Check if the country code exists in destinations
	if (linkInfo.destinations[countryCode])
		return linkInfo.destinations[countryCode];
	// Fallback to default
	return linkInfo.destinations.default;
}
