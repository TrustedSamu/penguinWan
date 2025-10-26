// Penguin Video Studio - Frontend JavaScript
class PenguinVideoStudio {
    constructor() {
        // Initialize properties
        this.selectedImage = null;
        this.currentTaskId = null;
        this.statusCheckInterval = null;
        this.currentTab = 'image'; // 'image' or 'text'
        
        // Pricing data for both models (per second)
        this.pricing = {
            duration: {
                5: 5,
                10: 10
            },
            resolution: {
                '480p': 0.02,  // $0.02 per second for 480p
                '720p': 0.03,  // $0.03 per second for 720p
                '1080p': 0.05  // $0.05 per second for 1080p
            },
            audio: {
                true: 0.01,   // $0.01 per second for audio
                false: 0      // No additional cost for silent video
            }
        };
        
        // Initialize everything
        this.initializeElements();
        this.attachEventListeners();
        this.checkServerStatus();
        this.updateCostCalculator();
    }

    initializeElements() {
        // Tab elements
        this.imageTabBtn = document.getElementById('imageTabBtn');
        this.textTabBtn = document.getElementById('textTabBtn');
        this.imageTab = document.getElementById('imageTab');
        this.textTab = document.getElementById('textTab');

        // Image upload elements
        this.imageUploadArea = document.getElementById('imageUploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.imagePreview = document.getElementById('imagePreview');
        this.previewImg = document.getElementById('previewImg');
        this.removeImageBtn = document.getElementById('removeImage');

        // Text input elements
        this.textPrompt = document.getElementById('textPrompt');
        this.negativePrompt = document.getElementById('negativePrompt');

        // Image to Video Settings
        this.imagePrompt = document.getElementById('imagePrompt');
        this.imageDuration = document.getElementById('imageDuration');
        this.imageResolution = document.getElementById('imageResolution');
        this.imageAudio = document.getElementById('imageAudio');
        this.imagePromptExtend = document.getElementById('imagePromptExtend');
        this.imageWatermark = document.getElementById('imageWatermark');

        // Text to Video Settings
        this.textDuration = document.getElementById('textDuration');
        this.textResolution = document.getElementById('textResolution');
        this.textAudio = document.getElementById('textAudio');
        this.textPromptExtend = document.getElementById('textPromptExtend');
        this.textWatermark = document.getElementById('textWatermark');

        // Cost calculator elements
        this.imageDurationCost = document.getElementById('imageDurationCost');
        this.imageResolutionCost = document.getElementById('imageResolutionCost');
        this.imageAudioCost = document.getElementById('imageAudioCost');
        this.imageTotalCost = document.getElementById('imageTotalCost');

        this.textDurationCost = document.getElementById('textDurationCost');
        this.textResolutionCost = document.getElementById('textResolutionCost');
        this.textAudioCost = document.getElementById('textAudioCost');
        this.textTotalCost = document.getElementById('textTotalCost');

        // Status elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusDot = this.statusIndicator.querySelector('.status-dot');
        this.statusText = this.statusIndicator.querySelector('.status-text');

        // Action elements
        this.generateBtn = document.getElementById('generateBtn');
        this.loadingSpinner = document.getElementById('loadingSpinner');

        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.generatedVideo = document.getElementById('generatedVideo');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.regenerateBtn = document.getElementById('regenerateBtn');

        // Error elements
        this.errorMessage = document.getElementById('errorMessage');
    }

    attachEventListeners() {
        // Tab switching
        this.imageTabBtn.addEventListener('click', () => this.switchTab('image'));
        this.textTabBtn.addEventListener('click', () => this.switchTab('text'));

        // Image upload events
        this.imageUploadArea.addEventListener('click', () => this.imageInput.click());
        this.imageUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.imageUploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.imageUploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        this.imageInput.addEventListener('change', this.handleImageSelect.bind(this));
        this.removeImageBtn.addEventListener('click', this.removeImage.bind(this));

        // Text prompt events
        this.textPrompt.addEventListener('input', this.updateGenerateButton.bind(this));

        // Image to Video settings change events
        this.imageDuration.addEventListener('change', () => this.updateImageCostCalculator());
        this.imageResolution.addEventListener('change', () => this.updateImageCostCalculator());
        this.imageAudio.addEventListener('change', () => this.updateImageCostCalculator());

        // Text to Video settings change events
        this.textDuration.addEventListener('change', () => this.updateTextCostCalculator());
        this.textResolution.addEventListener('change', () => this.updateTextCostCalculator());
        this.textAudio.addEventListener('change', () => this.updateTextCostCalculator());

        // Generate button
        this.generateBtn.addEventListener('click', this.generateVideo.bind(this));

        // Results actions
        this.downloadBtn.addEventListener('click', this.downloadVideo.bind(this));
        this.regenerateBtn.addEventListener('click', this.regenerateVideo.bind(this));
    }

    // Tab switching
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        this.imageTabBtn.classList.toggle('active', tab === 'image');
        this.textTabBtn.classList.toggle('active', tab === 'text');
        
        // Show/hide tab content
        this.imageTab.classList.toggle('active', tab === 'image');
        this.textTab.classList.toggle('active', tab === 'text');
        
        // Update generate button
        this.updateGenerateButton();
    }

    // Image upload handlers
    handleDragOver(e) {
        e.preventDefault();
        this.imageUploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.imageUploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.imageUploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleImageSelect({ target: { files } });
        }
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.selectedImage = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewImg.src = e.target.result;
                this.imageUploadArea.style.display = 'none';
                this.imagePreview.style.display = 'block';
                this.updateGenerateButton();
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage() {
        this.selectedImage = null;
        this.imageInput.value = '';
        this.imageUploadArea.style.display = 'block';
        this.imagePreview.style.display = 'none';
        this.updateGenerateButton();
    }

    // Generate button state
    updateGenerateButton() {
        let canGenerate = false;
        
        if (this.currentTab === 'image') {
            canGenerate = this.selectedImage !== null;
        } else if (this.currentTab === 'text') {
            canGenerate = this.textPrompt && this.textPrompt.value.trim().length > 0;
        }
        
        this.generateBtn.disabled = !canGenerate;
        
        if (canGenerate) {
            this.generateBtn.classList.add('penguin-float');
        } else {
            this.generateBtn.classList.remove('penguin-float');
        }
    }

    // Cost calculator for image to video
    updateImageCostCalculator() {
        const duration = parseInt(this.imageDuration.value);
        const resolution = this.imageResolution.value;
        const audio = this.imageAudio.value === 'true';

        const durationCost = this.pricing.duration[duration] || 0;
        const resolutionCost = this.pricing.resolution[resolution] || 0;
        const audioCost = this.pricing.audio[audio] || 0;

        const totalCost = (durationCost + resolutionCost + audioCost) * duration;

        this.imageDurationCost.textContent = `$${durationCost.toFixed(2)}/sec`;
        this.imageResolutionCost.textContent = `$${resolutionCost.toFixed(2)}/sec`;
        this.imageAudioCost.textContent = `$${audioCost.toFixed(2)}/sec`;
        this.imageTotalCost.textContent = `$${totalCost.toFixed(2)}`;

        // Add animation to total cost
        this.imageTotalCost.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.imageTotalCost.style.transform = 'scale(1)';
        }, 200);
    }

    // Cost calculator for text to video
    updateTextCostCalculator() {
        const duration = parseInt(this.textDuration.value);
        const resolution = this.textResolution.value;
        const audio = this.textAudio.value === 'true';

        const durationCost = this.pricing.duration[duration] || 0;
        const resolutionCost = this.pricing.resolution[resolution] || 0;
        const audioCost = this.pricing.audio[audio] || 0;

        const totalCost = (durationCost + resolutionCost + audioCost) * duration;

        this.textDurationCost.textContent = `$${durationCost.toFixed(2)}/sec`;
        this.textResolutionCost.textContent = `$${resolutionCost.toFixed(2)}/sec`;
        this.textAudioCost.textContent = `$${audioCost.toFixed(2)}/sec`;
        this.textTotalCost.textContent = `$${totalCost.toFixed(2)}`;

        // Add animation to total cost
        this.textTotalCost.style.transform = 'scale(1.1)';
        setTimeout(() => {
            this.textTotalCost.style.transform = 'scale(1)';
        }, 200);
    }

    // Initialize cost calculator
    updateCostCalculator() {
        this.updateImageCostCalculator();
        this.updateTextCostCalculator();
    }

    // Video generation
    async generateVideo() {
        this.setLoadingState(true);
        this.hideError();
        this.hideResults();

        try {
            const formData = new FormData();
            
            // Add data based on current tab
            if (this.currentTab === 'image') {
                formData.append('image', this.selectedImage);
                formData.append('prompt', this.imagePrompt.value);
                formData.append('duration', this.imageDuration.value);
                formData.append('resolution', this.imageResolution.value);
                formData.append('audio', this.imageAudio.value);
                formData.append('promptExtend', this.imagePromptExtend.value);
                formData.append('watermark', this.imageWatermark.value);
            } else if (this.currentTab === 'text') {
                formData.append('textPrompt', this.textPrompt.value);
                if (this.negativePrompt && this.negativePrompt.value.trim()) {
                    formData.append('negativePrompt', this.negativePrompt.value);
                }
                formData.append('duration', this.textDuration.value);
                formData.append('resolution', this.textResolution.value);
                formData.append('audio', this.textAudio.value);
                formData.append('promptExtend', this.textPromptExtend.value);
                formData.append('watermark', this.textWatermark.value);
            }

            const response = await fetch('/api/generate-video', {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(120000) // 2 minute timeout
            });

            const result = await response.json();

            if (result.success) {
                this.currentTaskId = result.taskId;
                this.showProgress();
                this.startStatusPolling();
            } else {
                throw new Error(result.error || 'Failed to generate video');
            }

        } catch (error) {
            console.error('Video generation error:', error);
            
            let errorMessage = 'Failed to generate video';
            if (error.name === 'TimeoutError') {
                errorMessage = 'Request timed out - the video generation service may be busy. Please try again in a few minutes.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out - please try again with a smaller image or different settings.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error - please try again in a moment.';
            } else {
                errorMessage = `Failed to generate video: ${error.message}`;
            }
            
            this.showError(errorMessage);
            this.setLoadingState(false);
        }
    }

    // Progress tracking
    showProgress() {
        this.progressSection.style.display = 'block';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Starting video generation...';
    }

    startStatusPolling() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }

        this.statusCheckInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/video-status/${this.currentTaskId}`);
                const result = await response.json();

                if (result.success) {
                    if (result.status === 'SUCCEEDED') {
                        this.showResults(result.videoUrl);
                        clearInterval(this.statusCheckInterval);
                    } else if (result.status === 'FAILED') {
                        this.showError(result.error || 'Video generation failed');
                        clearInterval(this.statusCheckInterval);
                    } else {
                        // Update progress
                        const progress = this.calculateProgress(result.status);
                        this.progressFill.style.width = `${progress}%`;
                        this.progressText.textContent = this.getStatusMessage(result.status);
                    }
                } else {
                    throw new Error(result.error || 'Status check failed');
                }
            } catch (error) {
                console.error('Status check error:', error);
                this.showError('Failed to check video status');
                clearInterval(this.statusCheckInterval);
            }
        }, 3000); // Check every 3 seconds
    }

    calculateProgress(status) {
        switch (status) {
            case 'PENDING': return 25;
            case 'RUNNING': return 75;
            case 'SUCCEEDED': return 100;
            case 'FAILED': return 0;
            default: return 0;
        }
    }

    getStatusMessage(status) {
        switch (status) {
            case 'PENDING': return 'Video is in queue...';
            case 'RUNNING': return 'Generating your amazing video...';
            case 'SUCCEEDED': return 'Video generation complete!';
            case 'FAILED': return 'Video generation failed';
            default: return 'Checking status...';
        }
    }

    // Results
    showResults(videoUrl) {
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'block';
        this.generatedVideo.src = videoUrl;
        this.setLoadingState(false);
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    downloadVideo() {
        if (this.generatedVideo.src) {
            const link = document.createElement('a');
            link.href = this.generatedVideo.src;
            link.download = `penguin-video-${Date.now()}.mp4`;
            link.click();
        }
    }

    regenerateVideo() {
        this.hideResults();
        this.generateVideo();
    }

    // Loading state
    setLoadingState(loading) {
        this.generateBtn.disabled = loading;
        this.loadingSpinner.style.display = loading ? 'block' : 'none';
        
        if (loading) {
            this.generateBtn.innerHTML = '<span class="penguin-working">🐧</span> Generating...';
        } else {
            this.generateBtn.innerHTML = '🎬 Generate Video';
        }
    }

    // Error handling
    showError(message) {
        this.errorMessage.querySelector('.error-text').textContent = message;
        this.errorMessage.style.display = 'flex';
        this.errorMessage.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    // Server status
    async checkServerStatus() {
        try {
            const response = await fetch('/api/health');
            const result = await response.json();
            
            if (result.success) {
                this.statusDot.className = 'status-dot online';
                this.statusText.textContent = 'Connected';
            } else {
                this.statusDot.className = 'status-dot offline';
                this.statusText.textContent = 'Disconnected';
            }
        } catch (error) {
            this.statusDot.className = 'status-dot offline';
            this.statusText.textContent = 'Disconnected';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.penguinStudio = new PenguinVideoStudio();
        console.log('✅ Penguin Video Studio initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Penguin Video Studio:', error);
    }
    
    // Add some fun penguin animations
    const penguinEmoji = document.querySelector('.penguin-emoji');
    if (penguinEmoji) {
        setInterval(() => {
            penguinEmoji.style.transform = 'scale(1.1)';
            setTimeout(() => {
                penguinEmoji.style.transform = 'scale(1)';
            }, 200);
        }, 5000);
    }
});

// Add some fun console messages
console.log('🐧 Welcome to Penguin Video Studio!');
console.log('🎬 Ready to transform your images into amazing videos!');
console.log('✨ Made with penguin love and AI magic!');
console.log('🔧 Backend API integration ready!');