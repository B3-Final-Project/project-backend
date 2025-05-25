import { Injectable, Logger } from '@nestjs/common';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName = process.env.S3_BUCKET_NAME!;

  constructor(private readonly s3Client: S3Client) {}

  /**
   * Delete an object from S3 bucket
   */
  async deleteObject(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully deleted object: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete object ${key}:`, error);
      return false;
    }
  }

  /**
   * Extract S3 key from full S3 URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      if (urlObj.hostname.includes(this.bucketName)) {
        // Format: https://bucket-name.s3.region.amazonaws.com/key
        return urlObj.pathname.substring(1); // Remove leading slash
      } else if (urlObj.pathname.startsWith(`/${this.bucketName}/`)) {
        // Format: https://s3.region.amazonaws.com/bucket-name/key
        return urlObj.pathname.substring(`/${this.bucketName}/`.length);
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to extract key from URL: ${url}`, error);
      return null;
    }
  }
}
