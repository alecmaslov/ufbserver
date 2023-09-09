import AWS, { S3 } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

export class AWSBucket {
    private s3: S3;

    constructor(
        private bucketConfig: AWS.ConfigurationOptions,
        public bucketName: string
    ) {
        AWS.config.update(bucketConfig);
        this.s3 = new AWS.S3();
    }

    public get region() : string {
        return this.bucketConfig.region as string;
    }

    public upload(
        params: S3.Types.PutObjectRequest,
        onProgress?: (progress: S3.ManagedUpload.Progress) => void,
        onComplete?: (err: Error, data: S3.ManagedUpload.SendData) => void
    ) {
        const upload = this.s3.upload(params);
        if (onProgress) {
            upload.on("httpUploadProgress", onProgress);
        }
        upload.send(onComplete);
    }

    public static generateObjectKeyForUser(userId: string, fileExt?: string) : string {
        return `${userId}/${uuidv4()}${fileExt ? `.${fileExt}` : ""}`;
    }

    public static generateObjectKeyForUserThumbnail(userId: string, existingObjectKey?: string) : string {
        let objectKeyId = uuidv4();
        // if there is an existing object key, we need to remove the file extension
        // and append the thumbnail extension
        if (existingObjectKey) {
            const ext = existingObjectKey.split(".").pop();
            const uuid = existingObjectKey.split("/").pop();
            if (ext && uuid) {
                objectKeyId = uuid.replace(`.${ext}`, "");
            }
        }
        return `${userId}/thumbnails/${objectKeyId}.jpg`;
    }

    public getSignedUploadURL(objectKey: string, expires: number, filetype?: string) {
        return this.s3.getSignedUrl("putObject", {
            Bucket: this.bucketName,
            Key: objectKey,
            Expires: expires,
            ContentType: filetype,
        });
    }

    public getSignedDownloadURL(objectKey: string, expires: number) {
        return this.s3.getSignedUrl("getObject", {
            Bucket: this.bucketName,
            Key: objectKey,
            Expires: expires,
        });
    }

    public deleteObject(objectKey: string, callback?: (err: Error, data: S3.DeleteObjectOutput) => void) {
        this.s3.deleteObject({
            Bucket: this.bucketName,
            Key: objectKey,
        }, callback);
    }
}

export function getBucketManager() {
    return new AWSBucket(
        {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_BUCKET_REGION,
        },
        "ufb-assets"
    );
}
