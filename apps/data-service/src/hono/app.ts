import { getLink } from "@repo/data-ops/queries/links";
import { cloudflareInfoSchema } from "@repo/data-ops/zod-schema/links";
import type { LinkClickMessageType } from "@repo/data-ops/zod-schema/queue";
import { Hono } from "hono";
import { getDestinationForCountry } from "@/helpers/route-ops";

export const App = new Hono<{ Bindings: Env }>();

App.get('/link-click/:accountId', async (c) => {
	const accountId = c.req.param('accountId')
	const doId = c.env.LINK_CLICK_TRACKER_OBJECT.idFromName(accountId)
	const stub = c.env.LINK_CLICK_TRACKER_OBJECT.get(doId)
	return await stub.fetch(c.req.raw)
})

App.get("/:id", async (c) => {
	const id = c.req.param("id");

	const linkInfo = await getLink(id);

	if (!linkInfo) {
		return c.text("Destination not Found", 404);
	}

	const cfHeader = cloudflareInfoSchema.safeParse(c.req.raw.cf);
	if (!cfHeader.success) {
		return c.text("Invalid Cloudflare Headers", 400);
	}

	const headers = cfHeader.data;
	const destination = getDestinationForCountry(linkInfo, headers.country);

	const queueMessage: LinkClickMessageType = {
		type: "LINK_CLICK",
		data: {
			id: id,
			country: headers.country,
			destination: destination,
			accountId: linkInfo.accountId,
			latitude: headers.latitude,
			longitude: headers.longitude,
			timestamp: new Date().toISOString()
		},
	};
	c.executionCtx.waitUntil(c.env.QUEUE.send(queueMessage))
	return c.redirect(destination);
});

