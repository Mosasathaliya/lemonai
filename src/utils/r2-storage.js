/**
 * R2 Storage Service
 * Handles file uploads, downloads, and management using Cloudflare R2
 */

class R2Storage {
  constructor(r2Bucket) {
    this.bucket = r2Bucket;
  }

  async uploadFile(key, data, metadata = {}) {
    try {
      await this.bucket.put(key, data, {
        httpMetadata: metadata.httpMetadata || {},
        customMetadata: metadata.customMetadata || {}
      });
      console.log(`✅ File uploaded to R2: ${key}`);
      return { success: true, key };
    } catch (error) {
      console.error(`❌ R2 upload failed: ${error.message}`);
      throw error;
    }
  }

  async downloadFile(key) {
    try {
      const object = await this.bucket.get(key);
      if (!object) return null;
      return {
        body: await object.arrayBuffer(),
        metadata: {
          httpMetadata: object.httpMetadata,
          customMetadata: object.customMetadata
        }
      };
    } catch (error) {
      console.error(`❌ R2 download failed: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key) {
    try {
      await this.bucket.delete(key);
      console.log(`✅ File deleted from R2: ${key}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ R2 delete failed: ${error.message}`);
      throw error;
    }
  }

  async listFiles(prefix = '', limit = 1000) {
    try {
      const listed = await this.bucket.list({ prefix, limit });
      return listed.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        uploaded: obj.uploaded
      }));
    } catch (error) {
      console.error(`❌ R2 list failed: ${error.message}`);
      throw error;
    }
  }

  getFileUrl(key) {
    return `/api/file/r2/${encodeURIComponent(key)}`;
  }

  async createMultipartUpload(key, metadata = {}) {
    try {
      const upload = await this.bucket.createMultipartUpload(key, {
        httpMetadata: metadata.httpMetadata || {},
        customMetadata: metadata.customMetadata || {}
      });
      console.log(`✅ Multipart upload created: ${key}`);
      return { uploadId: upload.uploadId, key };
    } catch (error) {
      console.error(`❌ Multipart upload creation failed: ${error.message}`);
      throw error;
    }
  }

  async uploadPart(key, uploadId, partNumber, data) {
    try {
      const upload = this.bucket.resumeMultipartUpload(key, uploadId);
      const part = await upload.uploadPart(partNumber, data);
      console.log(`✅ Part ${partNumber} uploaded for ${key}`);
      return { partNumber, etag: part.etag };
    } catch (error) {
      console.error(`❌ Part upload failed: ${error.message}`);
      throw error;
    }
  }

  async completeMultipartUpload(key, uploadId, parts) {
    try {
      const upload = this.bucket.resumeMultipartUpload(key, uploadId);
      await upload.complete(parts);
      console.log(`✅ Multipart upload completed: ${key}`);
      return { success: true, key };
    } catch (error) {
      console.error(`❌ Multipart upload completion failed: ${error.message}`);
      throw error;
    }
  }

  async abortMultipartUpload(key, uploadId) {
    try {
      const upload = this.bucket.resumeMultipartUpload(key, uploadId);
      await upload.abort();
      console.log(`✅ Multipart upload aborted: ${key}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Multipart upload abort failed: ${error.message}`);
      throw error;
    }
  }

  async copyFile(sourceKey, destKey) {
    try {
      await this.bucket.put(destKey, await this.bucket.get(sourceKey));
      console.log(`✅ File copied: ${sourceKey} -> ${destKey}`);
      return { success: true, key: destKey };
    } catch (error) {
      console.error(`❌ File copy failed: ${error.message}`);
      throw error;
    }
  }

  async getFileMetadata(key) {
    try {
      const object = await this.bucket.head(key);
      if (!object) return null;
      return {
        key,
        size: object.size,
        uploaded: object.uploaded,
        httpMetadata: object.httpMetadata,
        customMetadata: object.customMetadata,
        etag: object.etag
      };
    } catch (error) {
      console.error(`❌ Get metadata failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = R2Storage;
