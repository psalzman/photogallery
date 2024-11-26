const { S3Client, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const StorageService = require('./StorageService');
const config = require('../config');
const fs = require('fs').promises;

class S3StorageService extends StorageService {
    constructor() {
        super();
        console.log('Initializing S3 client with config:', {
            region: config.storage.s3.region,
            bucket: config.storage.s3.bucket,
            hasCredentials: !!(config.storage.s3.accessKeyId && config.storage.s3.secretAccessKey)
        });
        
        try {
            this.s3Client = new S3Client({
                region: config.storage.s3.region,
                credentials: {
                    accessKeyId: config.storage.s3.accessKeyId,
                    secretAccessKey: config.storage.s3.secretAccessKey
                }
            });
            this.bucket = config.storage.s3.bucket;
            console.log('S3 client initialized successfully');
        } catch (error) {
            console.error('Error initializing S3 client:', error);
            throw error;
        }
    }

    async uploadFile(file, accessCode, filename) {
        console.log(`Uploading file to S3: ${filename} for access code: ${accessCode}`);
        const fileContent = await fs.readFile(file.path);
        return this.uploadBuffer(fileContent, accessCode, filename);
    }

    async uploadBuffer(buffer, accessCode, filename) {
        const key = `${accessCode}/${filename}`;
        console.log(`Uploading buffer to S3 with key: ${key}`);
        
        const upload = new Upload({
            client: this.s3Client,
            params: {
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ContentType: 'image/jpeg', // Adjust based on actual file type if needed
            }
        });

        try {
            await upload.done();
            console.log(`Successfully uploaded to S3: ${key}`);
            return key;
        } catch (error) {
            console.error(`Error uploading to S3: ${error.message}`);
            throw error;
        }
    }

    async deleteFile(accessCode, filename) {
        const key = `${accessCode}/${filename}`;
        console.log(`Deleting file from S3: ${key}`);
        
        try {
            await this.s3Client.send(new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key
            }));
            console.log(`Successfully deleted from S3: ${key}`);
            return true;
        } catch (error) {
            console.error(`Error deleting file from S3: ${error.message}`);
            throw error;
        }
    }

    async getFileUrl(accessCode, filename) {
        const key = `${accessCode}/${filename}`;
        console.log(`Generating signed URL for: ${key}`);

        try {
            // First, verify the object exists
            try {
                const getCommand = new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key
                });
                await this.s3Client.send(getCommand);
            } catch (error) {
                if (error.name === 'NoSuchKey') {
                    console.error(`File does not exist in S3: ${key}`);
                    throw new Error(`File not found: ${filename}`);
                }
                throw error;
            }

            // Generate signed URL
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key
            });

            // Generate a signed URL that expires in 15 minutes (900 seconds)
            const signedUrl = await getSignedUrl(this.s3Client, command, {
                expiresIn: 900
            });

            console.log(`Generated signed URL for ${key}: ${signedUrl}`);
            return signedUrl;
        } catch (error) {
            console.error(`Error generating signed URL for ${key}:`, error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                code: error.code,
                requestId: error.$metadata?.requestId
            });
            throw error;
        }
    }

    async getFileStream(accessCode, filename) {
        const key = `${accessCode}/${filename}`;
        console.log(`Getting file stream from S3: ${key}`);

        try {
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key
            });

            const response = await this.s3Client.send(command);
            return response.Body;
        } catch (error) {
            console.error(`Error getting file stream from S3: ${error.message}`);
            throw error;
        }
    }
}

module.exports = S3StorageService;
