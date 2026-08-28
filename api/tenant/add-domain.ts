export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({ error: 'Domain is required' });
  }

  const vercelToken = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken || !projectId) {
    return res.status(500).json({ error: 'Vercel API credentials are not configured on the server.' });
  }

  try {
    let url = `https://api.vercel.com/v10/projects/${projectId}/domains`;
    if (teamId) {
      url += `?teamId=${teamId}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Vercel API Error]:", data);
      return res.status(response.status).json({ error: data.error?.message || 'Failed to add domain to Vercel' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error("[Add Domain Error]:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
