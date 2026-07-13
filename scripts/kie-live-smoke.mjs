const apiKey = process.env.KIE_API_KEY;
const callbackUrl = process.env.KIE_TEST_CALLBACK_URL;
const imageUrl = process.env.KIE_TEST_IMAGE_URL;

if (process.env.RUN_LIVE_KIE !== "1") {
  throw new Error("Live KIE smoke tests consume provider credits. Set RUN_LIVE_KIE=1 to confirm.");
}
if (!apiKey) throw new Error("KIE_API_KEY is required.");
if (!callbackUrl) throw new Error("KIE_TEST_CALLBACK_URL must be a public webhook endpoint.");
if (!imageUrl) throw new Error("KIE_TEST_IMAGE_URL must be a public or signed room/floor-plan image URL.");

const baseUrl = "https://api.kie.ai/api/v1";
const headers = { Authorization: `Bearer ${apiKey}`, "content-type": "application/json" };

async function create(model, input) {
  const response = await fetch(`${baseUrl}/jobs/createTask`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, callBackUrl: callbackUrl, input }),
  });
  const payload = await response.json();
  if (!response.ok || !payload?.data?.taskId) throw new Error(`${model} createTask failed: ${JSON.stringify(payload)}`);
  return payload.data.taskId;
}

async function waitForTask(taskId) {
  const deadline = Date.now() + 30 * 60 * 1000;
  while (Date.now() < deadline) {
    const response = await fetch(`${baseUrl}/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`, { headers });
    const payload = await response.json();
    const record = payload?.data;
    if (record?.state === "success") return record;
    if (record?.state === "fail") throw new Error(`${taskId} failed: ${record.failCode ?? "unknown"} ${record.failMsg ?? ""}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`${taskId} did not reach a terminal state within 30 minutes.`);
}

const prompt = "An original calm contemporary living room with pale oak, limestone, cream linen, realistic daylight, no people, no text, no logos, no watermark.";
const cases = [
  ["basic-text", "nano-banana-2-lite", { prompt, aspect_ratio: "4:3" }],
  ["basic-image", "nano-banana-2-lite", { prompt: `${prompt} Preserve the uploaded room geometry and camera position.`, aspect_ratio: "4:3", image_urls: [imageUrl] }],
  ["pro-text", "nano-banana-2", { prompt, aspect_ratio: "4:3", resolution: "2K", output_format: "jpg" }],
  ["pro-image", "nano-banana-2", { prompt: `${prompt} Preserve the uploaded room geometry and camera position.`, aspect_ratio: "4:3", image_input: [imageUrl], resolution: "2K", output_format: "jpg" }],
];

for (const [name, model, input] of cases) {
  const taskId = await create(model, input);
  console.log(JSON.stringify({ name, taskId, phase: "created" }));
  const record = await waitForTask(taskId);
  console.log(JSON.stringify({ name, taskId, phase: "success", creditsConsumed: record.creditsConsumed, resultJson: record.resultJson }));
}
