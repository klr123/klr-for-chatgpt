# 豆包 AI 试戴后端配置

GitHub Pages 只负责网页前端，`worker.js` 是单独部署的 Cloudflare Worker 代理。它避免把豆包密钥暴露给浏览器。

## 需要配置的位置

在 Cloudflare Dashboard → Workers & Pages → 你的 Worker → Settings → Variables and Secrets 中添加：

- `ARK_API_KEY`：火山方舟 API Key，选择 **Secret**
- `ARK_MODEL_ID`：模型接入点 ID，例如 `doubao-seedream-4-0-250828`

也可以用 Wrangler：

```bash
wrangler secret put ARK_API_KEY
wrangler secret put ARK_MODEL_ID
wrangler deploy
```

## 前端连接

部署完成后，把 Worker 地址配置到前端的 `AI_ENDPOINT`，例如：

```js
const AI_ENDPOINT = "https://hair-fit-doubao-proxy.<你的账号>.workers.dev/api/try-on";
```

代理接收 `person_image` 和 `hair_image` 两个 `data:image/...;base64,...` 字段，返回生成图片。不要把 `ARK_API_KEY` 写入 `index.html`、`app.js` 或 GitHub 仓库。
