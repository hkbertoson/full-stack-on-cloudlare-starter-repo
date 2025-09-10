import {
	WorkflowEntrypoint,
	type WorkflowEvent,
	type WorkflowStep,
} from "cloudflare:workers";
import { initDatabase } from "@repo/data-ops/database";
import { addEvaluation } from "@repo/data-ops/queries/evalutations";
import { aiDestinationChecker } from "@/helpers/ai-destination-checker";
import { collectDestinationInfo } from "@/helpers/browser-render";

export class DestinationEvaluationWorkflow extends WorkflowEntrypoint<
	Env,
	DestinationStatusEvaluationParams
> {
	async run(
		event: Readonly<WorkflowEvent<DestinationStatusEvaluationParams>>,
		step: WorkflowStep,
	) {
		const collectedData = await step.do(
			"Collect rendered destination page data",
			async () => {
				return collectDestinationInfo(this.env, event.payload.destinationUrl);
			},
		);

		const aiStatus = await step.do(
			"Use AI to check status of page",
			{
				retries: {
					limit: 0,
					delay: 0,
				},
			},
			async () => {
				return await aiDestinationChecker(this.env, collectedData.bodyText);
			},
		);

		const evalutationId = await step.do('Save evalutation result to database', async () => {
			return await addEvaluation({
				linkId: event.payload.linkId,
				status: aiStatus.status,
				reason: aiStatus.statusReason,
				accountId: event.payload.accountId,
				destinationUrl: event.payload.destinationUrl,
			});
		});

		await step.do('Backup destination HTML in R2', async () => {
			const accountId = event.payload.accountId;
			const r2PathHtml = `evaluations/${accountId}/html/${evalutationId}`;
			const r2PathBodyText = `evaluations/${accountId}/body-text/${evalutationId}`;
			await this.env.BUCKET.put(r2PathHtml, collectedData.html)
			await this.env.BUCKET.put(r2PathBodyText, collectedData.bodyText)
		})
	}
};
