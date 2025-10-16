// @ts-ignore
const router = require("koa-router")();

router.prefix("/api/agent");

router.use(require('./run.js'));
router.use(require('./proxy.js'));
router.use(require('./chat.js'));
router.use(require('./agent.js'));
router.use(require('./coding.js'));
router.use(require('./coding.sse.js'));
router.use(require('./tts.js'));
router.use(require('./summarize.js'));
router.use(require('./embeddings.js'));
router.use(require('./rerank.js'));
router.use(require('./coder.js'));
router.use(require('./vision.js'));
router.use(require('./image.js'));
router.use(require('./classify.js'));
router.use(require('./asr.js'));
router.use(require('./qwen.js'));
router.use(require('./coding-orchestrator.js'));
router.use(require('./multi-agent.js'));

module.exports = router.routes();
