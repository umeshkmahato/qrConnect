import { Injectable } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { env } from '../config/env';

/**
 * Private object storage for organization verification documents.
 * All access goes through short-lived presigned URLs; the bucket is never public.
 * In production this is S3 (optionally behind a malware-scanning pipeline);
 * locally it targets MinIO via S3_ENDPOINT.
 */
@Injectable()
export class StorageService {
  private readonly client = new S3Client({
    region: env.s3.region,
    endpoint: env.s3.endpoint || undefined,
    forcePathStyle: env.s3.forcePathStyle,
    credentials: env.s3.accessKey
      ? { accessKeyId: env.s3.accessKey, secretAccessKey: env.s3.secretKey }
      : undefined, // falls back to IAM role in AWS
  });

  newDocumentKey(orgId: string, fileName: string): string {
    const safe = fileName.replace(/[^A-Za-z0-9._-]/g, '_').slice(-80);
    return `org-documents/${orgId}/${randomUUID()}-${safe}`;
  }

  presignUpload(key: string, contentType: string, ttlSeconds = 300) {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, ContentType: contentType }),
      { expiresIn: ttlSeconds },
    );
  }

  presignDownload(key: string, ttlSeconds = 120) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }),
      { expiresIn: ttlSeconds },
    );
  }
}
