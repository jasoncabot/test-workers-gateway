import { ResponseInterceptor } from '.';

export const createStreamingInterceptor = (prefix: string, suffix: string): ResponseInterceptor => ({
	name: 'StreamingInterceptor',
	async handle(response: Response): Promise<Response> {
		const start = performance.now();
		console.log(`StreamingInterceptor: Intercepting response for streaming (elapsed: ${performance.now() - start} ms)`);

		if (!response.body) {
			return response;
		}

		const encoder = new TextEncoder();

		const { readable, writable } = new TransformStream({
			start(controller) {
				controller.enqueue(encoder.encode(prefix));
			},
			flush(controller) {
				controller.enqueue(encoder.encode(suffix));
			},
		});

		// Pipe upstream body through the transform.
		// We don't need to await this as the runtime keeps the Worker alive until the stream is fully consumed.
		console.log(`StreamingInterceptor: Piping response body through transform stream (elapsed: ${performance.now() - start} ms)`);
		response.body
			.pipeTo(writable)
			.then(() => {
				console.log(`StreamingInterceptor: Finished piping response body (elapsed: ${performance.now() - start} ms)`);
			})
			.catch((err) => {
				console.error(`StreamingInterceptor: Error piping response body (elapsed: ${performance.now() - start} ms)`, err);
			});

		// The response is a stream of unknown final length. Cloudflare Workers will automatically use chunked transfer encoding
		// when there's no Content-Length, which is the correct behavior for a streaming response.
		console.log(`StreamingInterceptor: Removing content-length header for streaming response (elapsed: ${performance.now() - start} ms)`);
		const headers = new Headers(response.headers);
		headers.delete('content-length');

		return new Response(readable, { status: response.status, statusText: response.statusText, headers });
	},
});

export const StreamingInterceptor = createStreamingInterceptor('START\n', '\nEND');
