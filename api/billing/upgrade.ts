export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { subscriptionId, productId, updateBehavior } = body;

    if (!subscriptionId || !productId) {
      return new Response(JSON.stringify({ error: 'Missing subscriptionId or productId' }), { status: 400 });
    }

    const apiKey = process.env.CREEM_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing CREEM_API_KEY');
    }

    const response = await fetch(`https://api.creem.io/v1/subscriptions/${subscriptionId}/upgrade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        product_id: productId,
        update_behavior: updateBehavior || 'proration-charge-immediately'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Creem upgrade failed", data);
      return new Response(JSON.stringify({ error: data.message || 'Creem upgrade failed' }), { status: response.status });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('Upgrade Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500 });
  }
}
