import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const vercelToken = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  console.log("Token exists?", !!vercelToken);
  console.log("ProjectId exists?", !!projectId);

  // Let's test with a random domain that is NOT configured
  const domain = 'not-configured-test-domain-123.com';

  const url = `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}/config`;
  console.log("URL:", url);

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${vercelToken}` }
  });
  
  const data = await res.json();
  console.log("Response Config:", JSON.stringify(data, null, 2));

  // Let's also test the domain status endpoint
  const url2 = `https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`;
  const res2 = await fetch(url2, {
    headers: { 'Authorization': `Bearer ${vercelToken}` }
  });
  
  const data2 = await res2.json();
  console.log("Response Domain:", JSON.stringify(data2, null, 2));
}

test();
