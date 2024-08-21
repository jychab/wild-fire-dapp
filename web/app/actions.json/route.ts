export async function GET(request: any) {
  const data = {
    rules: [
      {
        pathPattern: '/post',
        apiPath: 'https://api.hashfeed.social/post',
      },
    ],
  };

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
