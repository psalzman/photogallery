const config = require('../config');
const LocalStorageService = require('./LocalStorageService');
const S3StorageService = require('./S3StorageService');

class StorageFactory {
    static getStorage() {
        switch (config.storage.type) {
            case 's3':
                const { bucket, accessKeyId, secretAccessKey } = config.storage.s3;
                if (!bucket || !accessKeyId || !secretAccessKey) {
                    console.warn('Falling back to local storage. Missing S3 configuration:', {
                        hasBucket: !!bucket,
                        hasAccessKey: !!accessKeyId,
                        hasSecretKey: !!secretAccessKey
                    });
                    return new LocalStorageService();
                }
                console.log('Using S3 storage with bucket:', bucket);
                return new S3StorageService();
            case 'local':
                console.log('Using local storage');
                return new LocalStorageService();
            default:
                console.warn(`Unknown storage type: ${config.storage.type}, falling back to local storage`);
                return new LocalStorageService();
        }
    }
}

module.exports = StorageFactory;
