import { ResponseInterceptor } from '.';

export interface ExternalServiceDefinition {
	customRPCFunction(response: Response): Promise<Response>;
}

export const createExternalServiceInterceptor = (service: ExternalServiceDefinition): ResponseInterceptor => ({
	name: 'ExternalServiceInterceptor',
	async handle(response: Response): Promise<Response> {
		return service.customRPCFunction(response);
	},
});
