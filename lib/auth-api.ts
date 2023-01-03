import { Aws } from 'aws-cdk-lib';
import { Cors, EndpointType, IResource, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

type AuthApiProps = {
	userPoolId: string;
	userPoolClientId: string;
};

export class AuthApi extends Construct {
	private auth: IResource;
	private userPoolId: string;
	private userPoolClientId: string;

	constructor(scope: Construct, id: string, props: AuthApiProps) {
		super(scope, id);

		({ userPoolId: this.userPoolId, userPoolClientId: this.userPoolClientId } = props);

		const api = new RestApi(this, 'AuthServiceApi', {
			description: 'Authentication Service RestApi',
			endpointTypes: [EndpointType.REGIONAL],
			defaultCorsPreflightOptions: {
				allowOrigins: Cors.ALL_ORIGINS,
			},
		});


		this.auth = api.root.addResource('auth');

		const entry = './lambda/auth';

		this.addRoute('signout', 'GET', 'SignoutFn', `${entry}/signout.ts`);
		this.addRoute('signup', 'POST', 'SignupFn', `${entry}/signup.ts`, true, 'cognito-idp:*');
		this.addRoute('signin', 'POST', 'SigninFn', `${entry}/signin.ts`, true, 'cognito-idp:*');
		this.addRoute('confirm_signup', 'POST', 'ConfirmFn', `${entry}/confirm-signup.ts`, true, 'cognito-idp:*');
	}

	private addRoute(
		resourceName: string,
		method: string,
		fnName: string,
		fnEntry: string,
		allowCognitoAccess?: boolean,
		actions?: string
	): void {
		const commonFnProps = {
			runtime: Runtime.NODEJS_16_X,
			handler: 'handler',
			environment: {
				USER_POOL_ID: this.userPoolId,
				CLIENT_ID: this.userPoolClientId,
			},
		};

		const resource = this.auth.addResource(resourceName);

		const fn = new NodejsFunction(this, fnName, {
			...commonFnProps,
			entry: fnEntry,
		});

		if (allowCognitoAccess && actions) {
			fn.addToRolePolicy(
				new PolicyStatement({
					effect: Effect.ALLOW,
					actions: [actions],
					resources: [`arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/${this.userPoolId}`],
				})
			);
		}

		resource.addMethod(method, new LambdaIntegration(fn));
	}
}