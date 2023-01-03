import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthApi } from './auth-api';
import { ProtectedApi } from './protected-api';
import { CognitoUserPool } from './user-pool';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsServerlessAuthXStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

		const userPool = new CognitoUserPool(this, 'UserPool');

		const { userPoolId, userPoolClientId } = userPool;

		new AuthApi(this, 'AuthServiceApi', {
			userPoolId,
			userPoolClientId,
		});

		new ProtectedApi(this, 'ProtectedApi', {
			userPoolId,
			userPoolClientId,
		});
	}
}

