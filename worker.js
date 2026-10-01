// Cloudflare Worker backend proxy for Doubao Seedream image editing.
// Configure secrets with: wrangler secret put ARK_API_KEY
// Configure model with: wrangler secret put ARK_MODEL_ID
// Or set both as Worker environment variables in the Cloudflare dashboard.
const ALLOWED_ORIGINS = ["https://klr123.github.io"];
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = { "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    const url = new URL(request.url);
    if (url.pathname !== "/api/try-on" || request.method !== "POST") return new Response("Not found", { status: 404, headers: cors });
    if (!env.ARK_API_KEY) return new Response(JSON.stringify({ error: "ARK_API_KEY is not configured" }), { status: 503, headers: { ...cors, "content-type": "application/json" } });
    try {
      const body = await request.json();
      if (!body.person_image || !body.hair_image) throw new Error("需要本人照片和目标发型图");
      const prompt = body.prompt || "保留第一张图人物的脸部、五官、表情、肤色、姿势、服装和背景，只将头发替换为第二张图所示的发型。发型要自然贴合头型、发际线和光线，生成真实的正面人物照片，不要改变身份，不要添加文字或水印。";
      const result = await fetch("https://ark.cn-beijing.volces.com/api/v3/images/generations", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.ARK_API_KEY}` }, body: JSON.stringify({ model: env.ARK_MODEL_ID || "doubao-seedream-4-0-250828", prompt, image: [body.person_image, body.hair_image], size: body.size || "2K", output_format: "png", response_format: "b64_json", watermark: false }) });
      const data = await result.json();
      if (!result.ok) return new Response(JSON.stringify({ error: data?.error?.message || "Doubao request failed" }), { status: 502, headers: { ...cors, "content-type": "application/json" } });
      const image = data?.data?.[0]?.b64_json || data?.data?.[0]?.url;
      if (!image) throw new Error("豆包没有返回图片");
      return new Response(JSON.stringify({ image: image.startsWith("data:") ? image : `data:image/png;base64,${image}` }), { headers: { ...cors, "content-type": "application/json" } });
    } catch (error) { return new Response(JSON.stringify({ error: error.message || "Invalid request" }), { status: 400, headers: { ...cors, "content-type": "application/json" } }); }
  }
};
