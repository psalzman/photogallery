require('dotenv').config();

const config = {
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key'
    },
    storage: {
        type: process.env.STORAGE_TYPE || 'local',
        s3: {
            bucket: process.env.S3_BUCKET,
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        },
        local: {
            uploadDir: process.env.LOCAL_UPLOAD_DIR || 'photo-uploads',
            tempDir: process.env.LOCAL_TEMP_DIR || 'temp_uploads'
        }
    }
};

// Log storage configuration for debugging
console.log('Storage Configuration:', {
    type: config.storage.type,
    s3: {
        bucket: config.storage.s3.bucket,
        region: config.storage.s3.region,
        hasAccessKey: !!config.storage.s3.accessKeyId,
        hasSecretKey: !!config.storage.s3.secretAccessKey
    }
});

module.exports = config;
