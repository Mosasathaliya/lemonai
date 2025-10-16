const router = require("koa-router")();
const MultiModelAgent = require("@src/agent/multi-model-agent");
const Message = require("@src/utils/message");

router.post("/v1/multi-agent/run", async (ctx) => {
  const { request, response, state } = ctx;
  const body = request.body || {};
  const { goal, conversation_id, use_models = ["planner", "backend_coder", "frontend_coder", "reviewer"] } = body;

  if (!goal) {
    ctx.status = 400;
    ctx.body = { error: { message: "goal required", type: "bad_request" } };
    return;
  }

  try {
    const context = {
      conversation_id: conversation_id || `multi_${Date.now()}`,
      user_id: state.user?.id,
      goal,
      use_models
    };

    const agent = new MultiModelAgent(context);

    const plan = await agent.plan(goal);
    
    const taskResults = {};
    for (const task of plan.tasks || []) {
      const result = await agent.executeTask(task);
      taskResults[task.id] = result;
    }

    const review = await agent.review(taskResults);

    const memory = agent.getMemory();

    ctx.body = {
      conversation_id: context.conversation_id,
      plan,
      results: taskResults,
      review,
      memory: {
        history_length: memory.history_length,
        artifacts_count: memory.artifacts_count,
        models_used: [...new Set(memory.history.map(h => h.model).filter(Boolean))]
      }
    };
  } catch (error) {
    ctx.status = 502;
    ctx.body = { error: { message: error.message, type: "multi_agent_error" } };
  }
});

router.get("/v1/multi-agent/memory/:conversation_id", async (ctx) => {
  ctx.status = 501;
  ctx.body = { error: { message: "Memory persistence not implemented", type: "not_implemented" } };
});

module.exports = exports = router.routes();
