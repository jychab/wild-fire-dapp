import { ACTIONS_CORS_HEADERS, ActionsJson } from '@solana/actions';

export const GET = async () => {
  const data: ActionsJson = {
    rules: [
      {
        pathPattern: '/post',
        apiPath: 'https://api.blinksfeed.com/post',
      },
      {
        pathPattern: '/mint/create',
        apiPath: 'https://api.blinksfeed.com/mint/create',
      },
    ],
  };

  return Response.json(data, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// ensures cors
export const OPTIONS = GET;
