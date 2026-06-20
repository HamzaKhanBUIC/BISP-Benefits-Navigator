import { GoogleAuth } from "google-auth-library";

async function main() {
  const b64 = process.env.GCP_SERVICE_ACCOUNT_KEY;
  if (!b64) throw new Error("GCP_SERVICE_ACCOUNT_KEY env var is required");
  const json = Buffer.from(b64, "base64").toString("utf-8");
  const credentials = JSON.parse(json);

  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us-central1";

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` }
  });
  
  if (!res.ok) {
    console.error("Failed to list models:", await res.text());
    return;
  }
  
  const data = await res.json();
  const models = data.models || data.publisherModels || [];
  
  console.log("Available Gemini Models:");
  models.forEach((m: any) => {
    if (m.name.includes("gemini")) {
      console.log(m.name);
    }
  });
  
  console.log("Raw Response size:", models.length);
  console.log(JSON.stringify(models.slice(0, 5).map((m: any) => m.name), null, 2));
}

main().catch(console.error);
