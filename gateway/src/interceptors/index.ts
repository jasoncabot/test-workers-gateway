export { AuthInterceptor } from './auth';
export { createExternalServiceInterceptor } from './externalservice';
export type { ExternalServiceDefinition } from './externalservice';
export { LoggingInterceptor } from './logging';
export { StreamingInterceptor } from './streaming';

// The actual types we care about
export interface RequestInterceptor {
	name: string;
	handle(request: Request, context: ExecutionContext): Promise<Request | Response>;
}

export interface ResponseInterceptor {
	name: string;
	handle(response: Response, context: ExecutionContext): Promise<Response>;
}
