import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ManagedPolicy, Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda'; 
import { ApiGatewayToLambda } from '@aws-solutions-constructs/aws-apigateway-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class AuthenticationTuTorneoStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, {
      ...props,
      description: 'Authentication Tu Torneo Stack: Stack to handle Tu Torneo authentication',
    });
    
    const environment = this.node.tryGetContext("attSecurityEnvironment");
    const userPoolId = this.node.tryGetContext('cognitoUserPoolId');   
    const clientId = this.node.tryGetContext('cognitoClientId');   

    // Create a role for the Lambda function 
    const lambdaRole = new Role(this, 'LambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    lambdaRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
    const userPoolARN = `arn:aws:cognito-idp:${this.region}:${this.account}:userpool/${userPoolId}`;    
    lambdaRole.addToPolicy(new PolicyStatement({
      actions: ['cognito-idp:AdminInitiateAuth', 'cognito-idp:AdminUserGlobalSignOut'],
      resources: [userPoolARN],
    }));

    const getConfigLambda = new Function(this, 'SecurityLambda', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'app.handler', 
      code: Code.fromAsset('src'), 
      role: lambdaRole,
      description: 'Lambda to handle authorization request',
      environment: {
        USER_POOL_ID: userPoolId,
        COGNITO_CLIENT_ID: clientId,
      },
    });

    const apiGatewayToLambda = new ApiGatewayToLambda(this, 'SecurityGateway', {
      existingLambdaObj: getConfigLambda,
      apiGatewayProps: {
        description: 'API Gateway for Tu Torneo authentication',
        proxy: false,
        deployOptions: {
          stageName: environment,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
          allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        },
        defaultMethodOptions: {
          authorizationType: apigateway.AuthorizationType.NONE,
        },
      }
    });
    apiGatewayToLambda.apiGateway.root.addResource('auth').addMethod('POST', new apigateway.LambdaIntegration(getConfigLambda));
  }
}