import { APIGatewayProxyResult } from 'aws-lambda';

export const responseUtil = {
  success: (body: any): APIGatewayProxyResult => ({
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify(body),
  }),

  badRequest: (message: string): APIGatewayProxyResult => ({
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify({ error: { code: 400, message } }),
  }),

  unauthorized: (message: string): APIGatewayProxyResult => ({
    statusCode: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify({ error: { code: 401, message } }),
  }),

  internalServerError: (message: string): APIGatewayProxyResult => ({
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: JSON.stringify({ error: { code: 500, message } }),
  }),
};