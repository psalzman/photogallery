import API_BASE_URL from '../config/api';

class QueueUpload {
  constructor(chunkSize = 512 * 1024) { // Reduced to 512KB chunks by default
    this.queue = [];
    this.isProcessing = false;
    this.chunkSize = chunkSize;
    this.onProgress = null;
    this.onFileProgress = null;
    this.onComplete = null;
    this.onError = null;
    this.maxRetries = 3;
    this.baseDelay = 500; // Increased base delay between chunks
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

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async uploadChunkWithRetry(formData, chunkIndex, totalChunks, file, retryCount = 0) {
    try {
      // Exponential backoff delay between retries
      if (retryCount > 0) {
        const backoffDelay = Math.min(this.baseDelay * Math.pow(2, retryCount - 1), 10000);
        await this.sleep(backoffDelay);
      }

      const response = await fetch(`${API_BASE_URL}/photos/upload-chunk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage;
        try {
          // Try to parse error as JSON
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || `Upload failed: ${response.statusText}`;
        } catch (e) {
          // If response is not JSON (e.g., HTML error page)
          const text = await response.text();
          errorMessage = `Server error (${response.status}): ${text.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }

      // Ensure response is valid JSON
      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully:`, result);
      return result;

    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex + 1}/${totalChunks}:`, error);
      
      // Retry logic for specific errors
      if (retryCount < this.maxRetries && (
          error.message.includes('SSL') || 
          error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('Server error') ||
          error.message.includes('Invalid JSON'))) {
        console.log(`Retrying chunk ${chunkIndex + 1}/${totalChunks}, attempt ${retryCount + 1}/${this.maxRetries}`);
        return this.uploadChunkWithRetry(formData, chunkIndex, totalChunks, file, retryCount + 1);
      }
      
      throw error;
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
        // Wait between chunks with increasing delay for larger files
        if (chunkIndex > 0) {
          const dynamicDelay = this.baseDelay + (Math.floor(chunkIndex / 3) * 200); // Increase delay every 3 chunks
          await this.sleep(dynamicDelay);
        }

        await this.uploadChunkWithRetry(formData, chunkIndex, totalChunks, file);

        uploadedChunks++;
        const fileProgress = (uploadedChunks / totalChunks) * 100;
        item.progress = fileProgress;
        this.onFileProgress?.(file, fileProgress);

        // If this was the last chunk, verify completion
        if (isLastChunk) {
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
