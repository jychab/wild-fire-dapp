import { ACTIONS_CORS_HEADERS, ActionsJson } from '@solana/actions';

export const GET = async () => {
  const data: ActionsJson = {
    rules: [
      {
        pathPattern: '/post',
        apiPath: 'https://api.blinksfeed.com/post',
      },
    ],
  };

  return Response.json(data, {
    headers: ACTIONS_CORS_HEADERS,
  });
};

// ensures cors
export const OPTIONS = GET;
