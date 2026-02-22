import { AuthInterceptor, LoggingInterceptor, StreamingInterceptor } from './interceptors';
import { GatewayPipeline, RouteConfig } from './pipeline';

// Static config that defines how each route is handled
const ROUTE_MAP: Record<string, RouteConfig> = {
	'/api/origin': {
		next: (env) => env.UPSTREAM_ORIGIN,
		requestInterceptors: [AuthInterceptor],
		responseInterceptors: [
			// As an example - after retrieving the response from the upstream, we go through multiple
			// response middlewares to filter and log the response
			LoggingInterceptor, 
			StreamingInterceptor, 
			LoggingInterceptor, 
			StreamingInterceptor, 
			LoggingInterceptor
		],
	},
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		console.log(`Incoming request for ${url.pathname}`);

		// Find the interceptors that will run for this request
		const config = ROUTE_MAP[url.pathname];
		if (!config) {
			return Response.json({ success: false, message: `no route for ${url.pathname}` }, { status: 404 });
		}

		// Create the set of steps that will be run for this request and response
		const pipeline = new GatewayPipeline(config.requestInterceptors, config.next(env), config.responseInterceptors);
		console.log(`Pipeline created:`, { pipeline: pipeline.toString() });

		// now go and run it
		try {
			return await pipeline.execute(request, ctx);
		} catch (err) {
			console.error('internal server error:', err);
			return Response.json({ success: false, message: `internal server error` }, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
