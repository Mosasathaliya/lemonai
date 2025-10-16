const router = require("koa-router")();

// R2 proxy
router.get("/__r2/:key", async (ctx) => {
  const { key } = ctx.params;
  const response = await fetch(`http://localhost/__r2/${key}`);
  ctx.body = await response.arrayBuffer();
});

router.put("/__r2/:key", async (ctx) => {
  const { key } = ctx.params;
  await fetch(`http://localhost/__r2/${key}`, {
    method: 'PUT',
    body: ctx.request.body
  });
  ctx.body = { success: true };
});

router.delete("/__r2/:key", async (ctx) => {
  const { key } = ctx.params;
  await fetch(`http://localhost/__r2/${key}`, { method: 'DELETE' });
  ctx.body = { success: true };
});

// D1 proxy
router.post("/__d1/query", async (ctx) => {
  const { sql, params } = ctx.request.body;
  const response = await fetch('http://localhost/__d1/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params })
  });
  ctx.body = await response.json();
});

// KV proxy
router.get("/__kv/:key", async (ctx) => {
  const { key } = ctx.params;
  const response = await fetch(`http://localhost/__kv/${key}`);
  ctx.body = await response.text();
});

router.put("/__kv/:key", async (ctx) => {
  const { key } = ctx.params;
  await fetch(`http://localhost/__kv/${key}`, {
    method: 'PUT',
    body: ctx.request.body
  });
  ctx.body = { success: true };
});

router.delete("/__kv/:key", async (ctx) => {
  const { key } = ctx.params;
  await fetch(`http://localhost/__kv/${key}`, { method: 'DELETE' });
  ctx.body = { success: true };
});

module.exports = exports = router;
