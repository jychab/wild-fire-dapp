export async function GET(request: any) {
  const data = {
    rules: [
      {
        pathPattern: '/post',
        apiPath: 'https://api.blinksfeed.com/post',
      },
    ],
  };

  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Content-Encoding, Accept-Encoding',
      'Content-Type': 'application/json',
    },
  });
}

export async function OPTIONS(request: any) {
  return new Response('', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, Content-Encoding, Accept-Encoding',
    },
  });
}
