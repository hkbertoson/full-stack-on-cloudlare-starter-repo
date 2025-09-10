import { WorkerEntrypoint } from "cloudflare:workers";
import { initDatabase } from "@repo/data-ops/database";
import { App } from "./hono/app";

export default class DataService extends WorkerEntrypoint<Env> {
	constructor(ctx: ExecutionContext, env: Env) {
		super(ctx, env);
		initDatabase(env.DB);
	}
	fetch(request: Request) {
		return App.fetch(request, this.env, this.ctx);
	}
	queue(batch: MessageBatch<unknown>): void | Promise<void> {
		for (const message of batch.messages) {
			console.log("Queue Event", message.body)
		}
	}
}
