import API_BASE_URL from '../config/api';

class QueueUpload {
  constructor(chunkSize = 1024 * 1024) { // 1MB chunks by default
    this.queue = [];
    this.isProcessing = false;
    this.chunkSize = chunkSize;
    this.onProgress = null;
    this.onFileProgress = null;
    this.onComplete = null;
    this.onError = null;
  }

  addFiles(files, accessCode) {
    files.forEach(file => {
      this.queue.push({
        file,
        accessCode,
        progress: 0,
        status: 'queued'
      });
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    let totalProgress = 0;

    while (this.queue.length > 0) {
      const item = this.queue[0];
      try {
        await this.uploadFile(item);
        totalProgress = ((this.queue.length) / this.queue.length) * 100;
        this.onProgress?.(totalProgress);
      } catch (error) {
        item.status = 'error';
        this.onError?.(error, item.file);
        break; // Stop processing on error
      }
      this.queue.shift();
    }

    this.isProcessing = false;
    if (this.queue.length === 0) {
      this.onComplete?.();
    }
  }

  async uploadFile(item) {
    const file = item.file;
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    let uploadedChunks = 0;

    console.log(`Starting upload of ${file.name} (${file.size} bytes) in ${totalChunks} chunks`);

    // Upload chunks sequentially
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const chunk = file.slice(start, end);
      const isLastChunk = chunkIndex === totalChunks - 1;

      // Create metadata string without dots
      const metadata = `${chunkIndex}_${totalChunks}_${isLastChunk}_${file.size}`;
      
      const formData = new FormData();
      formData.append('chunk', new Blob([chunk], { type: file.type }));
      formData.append('metadata', metadata);
      formData.append('filename', file.name);
      formData.append('accessCode', item.accessCode);

      console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks} for ${file.name} (${chunk.size} bytes)`);

      try {
        // Wait a bit between chunks to ensure proper ordering
        if (chunkIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const response = await fetch(`${API_BASE_URL}/photos/upload-chunk`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.details || `Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully:`, result);

        uploadedChunks++;
        const fileProgress = (uploadedChunks / totalChunks) * 100;
        item.progress = fileProgress;
        this.onFileProgress?.(file, fileProgress);

        // If this was the last chunk, verify completion
        if (isLastChunk) {
          if (result.error) {
            throw new Error(result.error);
          }
          console.log(`Upload completed for ${file.name}`);
        }
      } catch (error) {
        console.error(`Error uploading chunk ${chunkIndex + 1}/${totalChunks}:`, error);
        throw error;
      }
    }

    item.status = 'completed';
  }

  setCallbacks({ onProgress, onFileProgress, onComplete, onError }) {
    this.onProgress = onProgress;
    this.onFileProgress = onFileProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }
}

export default QueueUpload;
