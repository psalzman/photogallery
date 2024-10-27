const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const StorageService = require('./StorageService');
const config = require('../config');

class LocalStorageService extends StorageService {
    constructor() {
        super();
        this.baseDir = path.join(__dirname, '..', config.storage.local.uploadDir);
    }

    async ensureDirectory(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }

    async uploadFile(file, accessCode, filename) {
        const dirPath = path.join(this.baseDir, accessCode);
        await this.ensureDirectory(dirPath);
        const finalPath = path.join(dirPath, filename);
        await fs.rename(file.path, finalPath);
        return finalPath;
    }

    async uploadBuffer(buffer, accessCode, filename) {
        const dirPath = path.join(this.baseDir, accessCode);
        await this.ensureDirectory(dirPath);
        const finalPath = path.join(dirPath, filename);
        await fs.writeFile(finalPath, buffer);
        return finalPath;
    }

    async deleteFile(accessCode, filename) {
        const filePath = path.join(this.baseDir, accessCode, filename);
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return true; // File doesn't exist, consider it deleted
            }
            throw error;
        }
    }

    async getFileUrl(accessCode, filename) {
        return path.join(this.baseDir, accessCode, filename);
    }

    async getFileStream(accessCode, filename) {
        const filePath = path.join(this.baseDir, accessCode, filename);
        try {
            // Use synchronous stat to check if file exists before creating stream
            fsSync.statSync(filePath);
            return fsSync.createReadStream(filePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`File not found: ${filename}`);
            }
            throw error;
        }
    }
}

module.exports = LocalStorageService;
