import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { InitiateAuthRequest } from 'aws-sdk/clients/cognitoidentityserviceprovider';

const cognito = new CognitoIdentityServiceProvider();

exports.handler = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	console.log('[EVENT]', event);

	if (!event.body) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: 'You must provide a username and password',
			}),
		};
	}

	const { username, password } = JSON.parse(event.body);

	const params: InitiateAuthRequest = {
		ClientId: process.env.CLIENT_ID!,
		AuthFlow: 'USER_PASSWORD_AUTH',
		AuthParameters: {
			USERNAME: username,
			PASSWORD: password,
		},
	};

	try {
		const { AuthenticationResult } = await cognito.initiateAuth(params).promise();
		console.log('[AUTH]', AuthenticationResult);

		if (!AuthenticationResult) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					message: 'User signin failed',
				}),
			};
		}

		const token = AuthenticationResult.IdToken;

		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Headers': '*',
				'Access-Control-Allow-Origin': '*',
				'Set-Cookie': `token=${token}; SameSite=None; Secure; HttpOnly; Path=/; Max-Age=3600;`,
			},
			body: JSON.stringify({
				message: 'Auth successfull',
				token: token,
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