/**
 * R2 Middleware
 * Injects R2 bucket into context if available
 */

module.exports = () => {
  return async (ctx, next) => {
    // R2 bucket will be injected by Worker/Container environment
    // Check if R2_BUCKET is available in environment
    if (global.R2_BUCKET) {
      ctx.r2 = global.R2_BUCKET;
    }
    await next();
  };
};
