import { ResponseInterceptor } from '.';

export const LoggingInterceptor: ResponseInterceptor = {
	name: 'LoggingInterceptor',
	async handle(response: Response, context: ExecutionContext): Promise<Response> {
		console.log(
			`Outgoing response: ${response.status} ${response.statusText} ${response.headers.get('Content-Length') || 'unknown length'}`,
		);
		return response; // Pass through to the next step in the pipeline
	},
};
