// app/actions.json/route.js

export async function GET(request: any) {
  const data = {
    rules: [
      {
        pathPattern: '/post/**',
        apiPath: 'http://api.hashfeed.social/post/**',
      },
    ],
  };

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
