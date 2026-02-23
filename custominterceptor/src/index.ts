import { WorkerEntrypoint } from 'cloudflare:workers';

export default class extends WorkerEntrypoint {
	async fetch() {
		return Response.json({ success: true });
	}

	async customRPCFunction(response: Response): Promise<Response> {
		const start = performance.now();
		console.log(`customRPCFunction: Intercepting response for streaming (elapsed: ${performance.now() - start} ms)`);

		if (!response.body) {
			return response;
		}

		const encoder = new TextEncoder();

		const { readable, writable } = new TransformStream({
			start(controller) {
				controller.enqueue(encoder.encode('custom rpc function started\n'));
			},
			flush(controller) {
				controller.enqueue(encoder.encode('\ncustom rpc function finished'));
			},
		});

		// Pipe upstream body through the transform.
		// We don't need to await this as the runtime keeps the Worker alive until the stream is fully consumed.
		console.log(`customRPCFunction: Piping response body through transform stream (elapsed: ${performance.now() - start} ms)`);
		response.body
			.pipeTo(writable)
			.then(() => {
				console.log(`customRPCFunction: Finished piping response body (elapsed: ${performance.now() - start} ms)`);
			})
			.catch((err) => {
				console.error(`customRPCFunction: Error piping response body (elapsed: ${performance.now() - start} ms)`, err);
			});

		// The response is a stream of unknown final length. Cloudflare Workers will automatically use chunked transfer encoding
		// when there's no Content-Length, which is the correct behavior for a streaming response.
		console.log(`customRPCFunction: Removing content-length header for streaming response (elapsed: ${performance.now() - start} ms)`);
		const headers = new Headers(response.headers);
		headers.delete('content-length');

		return new Response(readable, { status: response.status, statusText: response.statusText, headers });
	}
}
