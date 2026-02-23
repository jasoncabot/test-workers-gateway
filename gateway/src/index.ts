import {
	AuthInterceptor,
	ExternalServiceDefinition,
	LoggingInterceptor,
	StreamingInterceptor,
	createExternalServiceInterceptor,
} from './interceptors';
import { GatewayPipeline } from './pipeline';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		console.log(`Incoming request for ${url.pathname}`);

		// Middleware run on the incoming request
		const requestInterceptors = [AuthInterceptor];

		// Middleware run on the response from the upstream
		const responseInterceptors = [
			LoggingInterceptor,
			StreamingInterceptor,
			LoggingInterceptor,
			StreamingInterceptor,
			LoggingInterceptor,
			createExternalServiceInterceptor(env.EXTERNAL_INTERCEPTOR as unknown as ExternalServiceDefinition),
			LoggingInterceptor,
		];

		// Create the pipeline
		const pipeline = new GatewayPipeline(requestInterceptors, env.UPSTREAM_ORIGIN, responseInterceptors);
		console.log(`Pipeline created:`, { pipeline: pipeline.toString() });

		// Run the pipeline
		try {
			return await pipeline.execute(request, ctx);
		} catch (err) {
			console.error('internal server error:', err);
			return Response.json({ success: false, message: `internal server error` }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
