class StorageService {
    async uploadFile(file, accessCode, filename) {
        throw new Error('Method not implemented');
    }

    async uploadBuffer(buffer, accessCode, filename) {
        throw new Error('Method not implemented');
    }

    async deleteFile(accessCode, filename) {
        throw new Error('Method not implemented');
    }

    async getFileUrl(accessCode, filename) {
        throw new Error('Method not implemented');
    }
}

module.exports = StorageService;
