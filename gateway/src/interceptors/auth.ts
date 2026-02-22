import { RequestInterceptor } from '../pipeline';

export const createAuthInterceptor = (token: string): RequestInterceptor => ({
	name: 'AuthInterceptor',
	async handle(request: Request, context: ExecutionContext): Promise<Request | Response> {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || authHeader !== `Bearer ${token}`) {
			return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 });
		}
		return request; // Pass through to the next step in the pipeline
	},
});

export const AuthInterceptor = createAuthInterceptor('mysecrettoken');
