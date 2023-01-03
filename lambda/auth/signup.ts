import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { SignUpRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';

const cognito = new CognitoIdentityServiceProvider();

type eventBody = {
	username: string;
	email: string;
	password: string;
};

exports.handler = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	console.log('[EVENT]', event);

	if (!event.body) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: 'You must provide an email and password',
			}),
		};
	}

	const { username, email, password }: eventBody = JSON.parse(event.body);

	const params: SignUpRequest = {
		ClientId: process.env.CLIENT_ID!,
		Username: username,
		Password: password,
		UserAttributes: [{ Name: 'email', Value: email }],
	};

	try {
		const res = await cognito.signUp(params).promise();
		console.log('[AUTH]', res);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: res,
			}),
		};
	} catch (err) {
		console.error(err);
		return {
			statusCode: 500,
			body: JSON.stringify({
				message: err,
			}),
		};
	}
};