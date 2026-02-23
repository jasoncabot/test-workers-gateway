import type { RequestInterceptor, ResponseInterceptor } from './interceptors';

export class GatewayPipeline {
	constructor(
		private requestInterceptors: RequestInterceptor[],
		private upstream: Fetcher,
		private responseInterceptors: ResponseInterceptor[],
	) {}

	// The GatewayPipeline is the definition of how each request is handled.
	// When execute() is called, it runs through the steps in order:
	// 1. Request Interceptors (If any return a Response, it is returned immediately and the rest of the pipeline is skipped)
	// 2. Upstream fetch
	// 3. Response Interceptors
	async execute(initialRequest: Request, ctx: ExecutionContext): Promise<Response> {
		let request = initialRequest;

		// 1. Request Interceptors
		for (const interceptor of this.requestInterceptors) {
			const result = await interceptor.handle(request, ctx);

			if (result instanceof Response) {
				// If this interceptor returned a Response, we skip the rest of the pipeline and return it immediately
				return this.applyResponseInterceptors(result, ctx);
			}
			request = result;
		}

		// 2. Upstream fetch
		const upstreamResponse = await this.upstream.fetch(request);

		// 3. Response Interceptors
		return this.applyResponseInterceptors(upstreamResponse, ctx);
	}

	private async applyResponseInterceptors(response: Response, context: ExecutionContext): Promise<Response> {
		let finalResponse = response;
		for (const interceptor of this.responseInterceptors) {
			finalResponse = await interceptor.handle(finalResponse, context);
		}
		return finalResponse;
	}

	toString() {
		return `GatewayPipeline(requestInterceptors=[${this.requestInterceptors.map((i) => i.name).join(', ')}], upstream=${this.upstream}, responseInterceptors=[${this.responseInterceptors.map((i) => i.name).join(', ')}])`;
	}
}
