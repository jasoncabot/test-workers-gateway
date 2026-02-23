# Test Workers Gateway

This project is meant to serve as a demonstration for how to use Cloudflare Workers to intercept requests, responses and proxy through to upstream APIs.

## Getting Started

1. Clone the repository:

```bash
git clone git@github.com:jasoncabot/test-workers-gateway.git
cd test-workers-gateway
```

2. Install dependencies:

```bash
cd gateway
npm install
cd ../origin
npm install
```

3. Start the origin server:

```bash
cd origin
npm start
```

4. Start the gateway server:

```bash
cd gateway
npm start
```

5. Test the setup by making a request to the gateway:

```bash
curl -H "Authorization: Bearer mysecrettoken" http://localhost:8787/api/origin
```

## Interesting points to note

The origin server does nothing interesting except return a large (4MB) text file as a response as a static asset stored in `./origin/public/large-file.css`

The gateway `index.ts` holds only configuration about which middlewares and upstream services to use for each pathname

The gateway `pipeline.ts` is a static file that defines **how** the stages are processed and does not need to be changed or customised.

The interesting part are the `interceptors` which are the actual middlewares that can be customised to do anything you want with the request and response.

We have:

- A simple `AuthInterceptor` that checks for the presence of an `Authorization` header and returns a 401 if it's not present.
- A `LoggingInterceptor` that logs the request and response details.
- A `StreamingInterceptor` that demonstrates how to stream the response back to the client without having to wait for the entire response from the upstream to be received.

Most importantly the interceptors won't read entire request and responses into the memory of the worker (unless you explicitly want to) and instead work with streams, which means this architecture can support very large requests and responses without running into memory issues.

There is a `customerinterceptor` that shows how you can call call arbitrary RPC functions from an external Worker via [Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/). This pattern allows you to extend the gateway with custom logic without modifying the core gateway code.

The external Worker extends `WorkerEntrypoint` and can expose any RPC function with any signature:

```typescript
export default class extends WorkerEntrypoint {
	async customRPCFunction(response: Response): Promise<Response> {
		// Process the response and return a new one
	}

	async anotherFunction(data: SomeType, options: Options): Promise<Result> {
		// Any signature works - Service Bindings handle serialization
	}
}
```

The gateway then defines a TypeScript interface matching the expected functions and calls them directly on the bound service:

```typescript
interface ExternalServiceDefinition {
	customRPCFunction(response: Response): Promise<Response>;
}

// Called via: env.EXTERNAL_INTERCEPTOR.customRPCFunction(response)
```
