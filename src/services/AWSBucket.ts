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

    public get region(): string {
        return this.bucketConfig.region as string;
    }

    public upload(
        params: Omit<S3.Types.PutObjectRequest, "Bucket">,
        onProgress?: (progress: S3.ManagedUpload.Progress) => void,
        onComplete?: (err: Error, data: S3.ManagedUpload.SendData) => void
    ) {
        const uploadParams = {
            ...params,
            Bucket: this.bucketName,
        };

        const upload = this.s3.upload(uploadParams);
        if (onProgress) {
            upload.on("httpUploadProgress", onProgress);
        }
        upload.send(onComplete);
    }

    public uploadPromise(
        params: Omit<S3.Types.PutObjectRequest, "Bucket">,
        onProgress?: (progress: S3.ManagedUpload.Progress) => void
    ) {
        return new Promise<S3.ManagedUpload.SendData>((resolve, reject) => {
            this.upload(params, onProgress, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    public getSignedUploadURL(
        objectKey: string,
        expires: number,
        filetype?: string
    ) {
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

    public deleteObject(
        objectKey: string,
        callback?: (err: Error, data: S3.DeleteObjectOutput) => void
    ) {
        this.s3.deleteObject(
            {
                Bucket: this.bucketName,
                Key: objectKey,
            },
            callback
        );
    }

    public getObjectUrl(objectKey: string) {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;
    }
}

export function getBucketManager(bucketName: string) {
    return new AWSBucket(
        {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_BUCKET_REGION,
        },
        bucketName
    );
}
