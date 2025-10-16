const router = require("koa-router")();
const R2Storage = require("@src/utils/r2-storage");

/**
 * @swagger
 * /api/file/r2/upload:
 *   post:
 *     tags:
 *       - File
 *     summary: Upload file to R2 storage
 */
router.post("/r2/upload", async (ctx) => {
  const { request, response } = ctx;
  const { filename, content, metadata } = request.body;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const key = `user_${ctx.state.user.id}/${Date.now()}_${filename}`;
    const result = await r2.uploadFile(key, content, metadata);
    response.success({ key, url: r2.getFileUrl(key) });
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/{key}:
 *   get:
 *     tags:
 *       - File
 *     summary: Download file from R2 storage
 */
router.get("/r2/:key", async (ctx) => {
  const { response } = ctx;
  const { key } = ctx.params;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const file = await r2.downloadFile(decodeURIComponent(key));
    
    if (!file) {
      ctx.status = 404;
      ctx.body = "File not found";
      return;
    }

    ctx.body = Buffer.from(file.body);
    ctx.set("Content-Type", file.metadata.httpMetadata.contentType || "application/octet-stream");
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/{key}:
 *   delete:
 *     tags:
 *       - File
 *     summary: Delete file from R2 storage
 */
router.delete("/r2/:key", async (ctx) => {
  const { response } = ctx;
  const { key } = ctx.params;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    await r2.deleteFile(decodeURIComponent(key));
    response.success("File deleted");
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/list:
 *   get:
 *     tags:
 *       - File
 *     summary: List files in R2 storage
 */
router.get("/r2/list", async (ctx) => {
  const { response } = ctx;
  const { prefix } = ctx.query;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const userPrefix = `user_${ctx.state.user.id}/${prefix || ''}`;
    const files = await r2.listFiles(userPrefix);
    response.success(files);
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/multipart/create:
 *   post:
 *     tags:
 *       - File
 *     summary: Create multipart upload for large files
 */
router.post("/r2/multipart/create", async (ctx) => {
  const { request, response } = ctx;
  const { filename, metadata } = request.body;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const key = `user_${ctx.state.user.id}/${Date.now()}_${filename}`;
    const result = await r2.createMultipartUpload(key, metadata);
    response.success(result);
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/multipart/upload:
 *   post:
 *     tags:
 *       - File
 *     summary: Upload part of multipart upload
 */
router.post("/r2/multipart/upload", async (ctx) => {
  const { request, response } = ctx;
  const { key, uploadId, partNumber, data } = request.body;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const result = await r2.uploadPart(key, uploadId, partNumber, data);
    response.success(result);
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/multipart/complete:
 *   post:
 *     tags:
 *       - File
 *     summary: Complete multipart upload
 */
router.post("/r2/multipart/complete", async (ctx) => {
  const { request, response } = ctx;
  const { key, uploadId, parts } = request.body;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const result = await r2.completeMultipartUpload(key, uploadId, parts);
    response.success(result);
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/multipart/abort:
 *   post:
 *     tags:
 *       - File
 *     summary: Abort multipart upload
 */
router.post("/r2/multipart/abort", async (ctx) => {
  const { request, response } = ctx;
  const { key, uploadId } = request.body;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    await r2.abortMultipartUpload(key, uploadId);
    response.success("Upload aborted");
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/copy:
 *   post:
 *     tags:
 *       - File
 *     summary: Copy file within R2
 */
router.post("/r2/copy", async (ctx) => {
  const { request, response } = ctx;
  const { sourceKey, destFilename } = request.body;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const destKey = `user_${ctx.state.user.id}/${Date.now()}_${destFilename}`;
    const result = await r2.copyFile(sourceKey, destKey);
    response.success(result);
  } catch (error) {
    response.error(error.message);
  }
});

/**
 * @swagger
 * /api/file/r2/metadata/{key}:
 *   get:
 *     tags:
 *       - File
 *     summary: Get file metadata
 */
router.get("/r2/metadata/:key", async (ctx) => {
  const { response } = ctx;
  const { key } = ctx.params;

  if (!ctx.r2) {
    response.fail("R2 storage not available");
    return;
  }

  try {
    const r2 = new R2Storage(ctx.r2);
    const metadata = await r2.getFileMetadata(decodeURIComponent(key));
    
    if (!metadata) {
      response.fail("File not found");
      return;
    }

    response.success(metadata);
  } catch (error) {
    response.error(error.message);
  }
});

module.exports = router.routes();
