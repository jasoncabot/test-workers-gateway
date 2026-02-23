export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const host = url.origin;
		console.log(`Fetching large-file.css from ${host}`);
		// a test showing how to return a large file from the upstream
		return env.ASSETS.fetch(`${host}/large-file.css`);
	},
} satisfies ExportedHandler<Env>;
