const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static('public'));

// Ensure directories exist
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const outputDir = process.env.OUTPUT_DIR || 'outputs';

fs.ensureDirSync(uploadDir);
fs.ensureDirSync(outputDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Wan2.5-I2V-Preview API configuration
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_REGION = process.env.DASHSCOPE_REGION || 'singapore'; // 'singapore' or 'beijing'

// API endpoints based on region - both models use the same endpoint
const DASHSCOPE_BASE_URL = DASHSCOPE_REGION === 'beijing' 
    ? 'https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis'
    : 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis';

const DASHSCOPE_TASK_URL = DASHSCOPE_REGION === 'beijing'
    ? 'https://dashscope.aliyuncs.com/api/v1/tasks'
    : 'https://dashscope-intl.aliyuncs.com/api/v1/tasks';

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        message: '🐧 Penguin Video Studio is running!',
        apiKeyConfigured: !!DASHSCOPE_API_KEY,
        pricing: {
            resolution: {
                '480p': 0.02,
                '720p': 0.03,
                '1080p': 0.05
            },
            audio: {
                enabled: 0.01,
                disabled: 0
            },
            note: 'Pricing is per second of generated video. Only successful generations are charged.'
        }
    });
});

// Rate limiting - simple in-memory store
const requestTimes = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 2; // Max 2 requests per minute

// Generate video endpoint
app.post('/api/generate-video', upload.single('image'), async (req, res) => {
    try {
        if (!DASHSCOPE_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'API key not configured. Please set DASHSCOPE_API_KEY in your .env file.'
            });
        }

        // Determine mode based on whether image file is present
        const mode = req.file ? 'image' : 'text';

        // Extract parameters with defaults
        const { 
            duration = 5, 
            resolution = '1080p', 
            prompt = '', 
            textPrompt = '',
            negativePrompt = '',
            promptExtend = true, 
            watermark = false, 
            audio = true 
        } = req.body;

        // Validate based on mode
        if (mode === 'image' && !req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image file provided for image-to-video mode.'
            });
        }
        
        if (mode === 'text' && !textPrompt.trim()) {
            return res.status(400).json({
                success: false,
                error: 'No text prompt provided for text-to-video mode.'
            });
        }

        // Simple rate limiting
        const now = Date.now();
        const clientId = req.ip || 'unknown';
        const clientRequests = requestTimes.get(clientId) || [];
        
        // Remove old requests outside the window
        const recentRequests = clientRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
        
        if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests. Please wait a moment before generating another video.'
            });
        }
        
        // Add current request
        recentRequests.push(now);
        requestTimes.set(clientId, recentRequests);
        
        // Get image path and task ID
        const imagePath = req.file ? req.file.path : null;
        const taskId = uuidv4();

        console.log(`🐧 Starting ${mode}-to-video generation for task: ${taskId}`);
        if (mode === 'image') {
            console.log(`📸 Image: ${req.file.originalname}`);
        } else {
            console.log(`✍️ Text Prompt: ${textPrompt}`);
        }
        console.log(`⏱️ Duration: ${duration}s`);
        console.log(`📺 Resolution: ${resolution}`);
        console.log(`📝 Prompt: ${mode === 'image' ? (prompt || 'No prompt provided') : textPrompt}`);
        console.log(`🔊 Audio: ${audio ? 'Enabled' : 'Disabled'}`);

        // Add a small delay to prevent API rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Call appropriate API based on mode
        let result;
        if (mode === 'image' && imagePath) {
            result = await callImageToVideoAPI(imagePath, {
                duration,
                resolution,
                prompt,
                promptExtend,
                watermark,
                audio
            }, taskId);
        } else if (mode === 'text') {
            result = await callTextToVideoAPI({
                duration,
                resolution, // This will be mapped to size inside the function
                textPrompt,
                negativePrompt,
                promptExtend,
                watermark,
                audio
            }, taskId);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: missing required data for selected mode.'
            });
        }

        if (result.success) {
            res.json({
                success: true,
                taskId: result.taskId,
                message: result.message || 'Video generation task created successfully! 🎬'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Video generation failed'
            });
        }

    } catch (error) {
        console.error('❌ Video generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

// Get video status endpoint
app.get('/api/video-status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        
        if (!DASHSCOPE_API_KEY) {
            return res.status(400).json({
                success: false,
                error: 'API key not configured'
            });
        }

        // Check video generation status
        const status = await checkVideoStatus(taskId);
        res.json(status);

    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to check video status'
        });
    }
});

// Download video endpoint
app.get('/api/download/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const videoPath = path.join(outputDir, `${taskId}.mp4`);
        
        if (fs.existsSync(videoPath)) {
            res.download(videoPath, `penguin-video-${taskId}.mp4`);
        } else {
            res.status(404).json({
                success: false,
                error: 'Video file not found'
            });
        }
    } catch (error) {
        console.error('❌ Download error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Download failed'
        });
    }
});

// Call Wan2.5-I2V-Preview API (Image to Video)
async function callImageToVideoAPI(imagePath, params, taskId) {
    try {
        // Convert image to base64
        const imageBase64 = await convertImageToBase64(imagePath);
        
        // Prepare request payload according to API documentation
        const requestPayload = {
            model: "wan2.5-i2v-preview",
            input: {
                img_url: imageBase64,
                prompt: params.prompt || "A beautiful scene with dynamic movement and cinematic quality"
            },
            parameters: {
                resolution: params.resolution.toUpperCase(), // Convert to uppercase (480P, 720P, 1080P)
                duration: parseInt(params.duration),
                prompt_extend: params.promptExtend === 'true',
                watermark: params.watermark === 'true',
                audio: params.audio === 'true'
            }
        };

        console.log('📤 Sending request to Wan2.5-I2V-Preview API...');
        console.log('🔗 Endpoint:', DASHSCOPE_BASE_URL);
        console.log('📋 Payload:', JSON.stringify(requestPayload, null, 2));

        const response = await axios.post(DASHSCOPE_BASE_URL, requestPayload, {
            headers: {
                'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
                'X-DashScope-Async': 'enable',
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 2 minute timeout for initial API call
        });

        console.log('✅ API Response:', response.data);

        if (response.data && response.data.output) {
            const taskId = response.data.output.task_id;
            const taskStatus = response.data.output.task_status;
            
            return {
                success: true,
                taskId: taskId,
                taskStatus: taskStatus,
                message: 'Video generation task created successfully'
            };
        } else {
            return {
                success: false,
                error: 'Invalid API response format'
            };
        }

    } catch (error) {
        console.error('❌ API call failed:', error.response?.data || error.message);
        
        let errorMessage = 'API call failed';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'API request timed out - the video generation service may be busy. Please try again in a few minutes.';
        } else if (error.response?.status === 429) {
            errorMessage = 'Too many requests - please wait a moment before trying again.';
        } else if (error.response?.status === 401) {
            errorMessage = 'API key authentication failed - please check your API key.';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

// Call Wan2.5-T2V-Preview API (Text to Video)
async function callTextToVideoAPI(params, taskId) {
    try {
        // Convert resolution to size format (width×height) for text-to-video
        const resolutionMap = {
            '480p': '832*480',  // 16:9 aspect ratio (using * instead of ×)
            '720p': '1280*720', // 16:9 aspect ratio (using * instead of ×)
            '1080p': '1920*1080' // 16:9 aspect ratio (using * instead of ×)
        };
        
        console.log('🔍 Resolution mapping:', params.resolution, '->', resolutionMap[params.resolution]);
        
        // Prepare request payload for text-to-video
        const requestPayload = {
            model: "wan2.5-t2v-preview",
            input: {
                prompt: params.textPrompt,
                ...(params.negativePrompt && { negative_prompt: params.negativePrompt })
            },
            parameters: {
                size: resolutionMap[params.resolution] || '832*480', // Use size instead of resolution
                duration: parseInt(params.duration),
                prompt_extend: params.promptExtend === 'true',
                watermark: params.watermark === 'true',
                audio: params.audio === 'true'
            }
        };

        console.log('📤 Sending request to Wan2.5-T2V-Preview API...');
        console.log('🔗 Endpoint:', DASHSCOPE_BASE_URL);
        console.log('📋 Payload:', JSON.stringify(requestPayload, null, 2));
        console.log('🎯 Size parameter:', requestPayload.parameters.size);

        const response = await axios.post(DASHSCOPE_BASE_URL, requestPayload, {
            headers: {
                'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
                'X-DashScope-Async': 'enable',
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 2 minute timeout for initial API call
        });

        console.log('✅ API Response:', response.data);

        if (response.data && response.data.output) {
            const taskId = response.data.output.task_id;
            const taskStatus = response.data.output.task_status;
            
            return {
                success: true,
                taskId: taskId,
                taskStatus: taskStatus,
                message: 'Text-to-video generation task created successfully'
            };
        } else {
            return {
                success: false,
                error: 'Invalid API response format'
            };
        }

    } catch (error) {
        console.error('❌ Text-to-video API call failed:', error.response?.data || error.message);
        
        let errorMessage = 'Text-to-video API call failed';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code === 'ECONNABORTED') {
            errorMessage = 'API request timed out - the video generation service may be busy. Please try again in a few minutes.';
        } else if (error.response?.status === 429) {
            errorMessage = 'Too many requests - please wait a moment before trying again.';
        } else if (error.response?.status === 401) {
            errorMessage = 'API key authentication failed - please check your API key.';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

// Convert image file to base64
async function convertImageToBase64(imagePath) {
    try {
        const imageBuffer = await fs.readFile(imagePath);
        const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
        const base64String = imageBuffer.toString('base64');
        return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
        console.error('❌ Failed to convert image to base64:', error);
        throw error;
    }
}

// Check video generation status
async function checkVideoStatus(taskId) {
    try {
        const response = await axios.get(`${DASHSCOPE_TASK_URL}/${taskId}`, {
            headers: {
                'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
            }
        });

        console.log('📊 Status check response:', response.data);

        if (response.data && response.data.output) {
            const output = response.data.output;
            const taskStatus = output.task_status;
            
            if (taskStatus === 'SUCCEEDED' && output.video_url) {
                // Download and save video locally
                await downloadVideo(output.video_url, taskId);
                
                return {
                    success: true,
                    status: taskStatus,
                    videoUrl: `/api/download/${taskId}`,
                    progress: 100,
                    message: 'Video generation completed successfully!'
                };
            } else if (taskStatus === 'FAILED') {
                return {
                    success: false,
                    status: taskStatus,
                    error: output.message || 'Video generation failed'
                };
            } else {
                // Calculate progress based on status
                let progress = 0;
                if (taskStatus === 'PENDING') progress = 10;
                else if (taskStatus === 'RUNNING') progress = 50;
                
                return {
                    success: true,
                    status: taskStatus,
                    progress: progress,
                    message: `Video generation ${taskStatus.toLowerCase()}...`
                };
            }
        } else {
            return {
                success: false,
                error: 'Invalid status response format'
            };
        }

    } catch (error) {
        console.error('❌ Status check failed:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Status check failed'
        };
    }
}

// Download video from URL
async function downloadVideo(videoUrl, taskId) {
    try {
        const response = await axios.get(videoUrl, {
            responseType: 'stream',
            timeout: 60000 // 60 second timeout
        });

        const videoPath = path.join(outputDir, `${taskId}.mp4`);
        const writer = fs.createWriteStream(videoPath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Video downloaded: ${videoPath}`);
                resolve();
            });
            writer.on('error', reject);
        });

    } catch (error) {
        console.error('❌ Video download failed:', error);
        throw error;
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    console.error('❌ Server error:', error);
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🐧 Penguin Video Studio Server Started!');
    console.log(`🌐 Server running on http://localhost:${PORT}`);
    console.log(`🔑 API Key configured: ${DASHSCOPE_API_KEY ? '✅ Yes' : '❌ No - Please set DASHSCOPE_API_KEY in .env'}`);
    console.log(`📁 Upload directory: ${uploadDir}`);
    console.log(`📁 Output directory: ${outputDir}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🐧 Penguin Video Studio shutting down gracefully...');
    process.exit(0);
});
