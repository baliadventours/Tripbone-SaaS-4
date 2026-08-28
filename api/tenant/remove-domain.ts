export default async function handler(req: any, res: any) {
  if (req.method !== 'DELETE') {
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
    let url = `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`;
    if (teamId) {
      url += `?teamId=${teamId}`;
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("[Vercel API Error]:", data);
      return res.status(response.status).json({ error: data.error?.message || 'Failed to remove domain from Vercel' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[Remove Domain Error]:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
