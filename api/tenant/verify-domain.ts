export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const domain = req.query.domain;

  if (!domain) {
    return res.status(400).json({ error: 'Domain query parameter is required' });
  }

  const vercelToken = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !projectId) {
    return res.status(500).json({ error: 'Vercel API credentials are not configured on the server.' });
  }

  try {
    let url = `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}/config`;
    if (teamId) {
      url += `?teamId=${teamId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Vercel Verify Domain Error]:", data);
      return res.status(response.status).json({ error: data.error?.message || 'Failed to verify domain with Vercel' });
    }

    const isSubdomain = domain.split('.').length > 2;
    const isConfigured = data.misconfigured === false;

    return res.status(200).json({
      verified: isConfigured,
      domain: domain,
      isSubdomain: isSubdomain,
      expectedCname: 'cname.vercel-dns.com',
      expectedA: '76.76.21.21',
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Verify Domain Error]:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
