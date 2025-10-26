# 🐧 Penguin Video Studio - Node.js Edition

A complete Node.js application for the Wan2.5-I2V-Preview image-to-video model! Transform your static images into amazing videos with AI magic, featuring a delightful penguin-themed interface.

## ✨ Features

- 🎨 **Penguin-themed UI** - Cute and playful interface with bouncing penguins
- 📸 **Drag & Drop Upload** - Easy image upload with preview
- ⚙️ **Customizable Settings** - Duration and style options
- 🔐 **Environment-based API Key** - Secure configuration via .env file
- 🎬 **Real-time Generation** - Watch your videos come to life with progress tracking
- 📥 **Download Support** - Save your generated videos locally
- 📱 **Responsive Design** - Works on all devices
- 🚀 **Full Node.js Backend** - Express server with proper API integration

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# DASHSCOPE_API_KEY=your_actual_api_key_here
```

### 3. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Or production mode
npm start
```

### 4. Open in Browser
- Navigate to `http://localhost:3000`
- The penguin-themed interface will be ready to use!

## 🔧 Configuration

### Environment Variables (.env)

```env
# Wan2.5-I2V-Preview API Configuration
DASHSCOPE_API_KEY=your_api_key_here
DASHSCOPE_REGION=singapore

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### API Key Setup

1. Get your API key from the Wan2.5-I2V-Preview service
2. Add it to your `.env` file as `DASHSCOPE_API_KEY`
3. Set `DASHSCOPE_REGION` to either `singapore` or `beijing` based on your API key region
4. Restart the server
5. The status indicator will show if the API key is configured

## 💰 Pricing Information

The Penguin Video Studio includes a real-time cost calculator that shows the estimated cost based on your selected options:

### Wan2.5-I2V-Preview Pricing (Per Second)

| Resolution | Base Cost | Audio Cost | Total Cost |
|------------|-----------|------------|------------|
| 480p (SD)  | $0.02     | +$0.01     | $0.03/sec  |
| 720p (HD)  | $0.03     | +$0.01     | $0.04/sec  |
| 1080p (FHD)| $0.05     | +$0.01     | $0.06/sec  |

### Cost Examples

- **5-second 1080p video with audio**: $0.30
- **10-second 720p video with audio**: $0.40  
- **5-second 480p silent video**: $0.10
- **10-second 1080p silent video**: $0.50

### Important Notes

- 💡 **Only successful generations are charged** - failed attempts are free
- 💡 **Pricing is per second** of the final video duration
- 💡 **Audio generation adds $0.01 per second** to the base resolution cost
- 💡 **Cost calculator updates in real-time** as you change settings

The cost calculator appears prominently in the interface and updates automatically when you change any settings!

## 🛠️ Technical Architecture

### Backend (Node.js + Express)
- **Express Server**: RESTful API endpoints
- **Multer**: File upload handling with validation
- **Axios**: HTTP client for API calls
- **Form-Data**: Multipart form data for API requests
- **fs-extra**: Enhanced file system operations
- **dotenv**: Environment variable management

### Frontend (Vanilla JavaScript)
- **Modern ES6+**: Clean, modular JavaScript
- **Fetch API**: HTTP requests to backend
- **File API**: Client-side file handling
- **CSS Animations**: Penguin-themed animations

### API Endpoints

- `GET /` - Serve the main application
- `GET /api/health` - Server health check
- `POST /api/generate-video` - Generate video from image
- `GET /api/video-status/:taskId` - Check video generation status
- `GET /api/download/:taskId` - Download generated video

## 📁 Project Structure

```
penguin-video-studio/
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── .env.example          # Environment configuration template
├── .env                  # Your environment variables (create this)
├── public/               # Frontend files
│   ├── index.html       # Main HTML page
│   ├── styles.css       # Penguin-themed styling
│   └── script.js        # Frontend JavaScript
├── uploads/             # Uploaded images (auto-created)
└── outputs/            # Generated videos (auto-created)
```

## 🐧 Penguin Features

- **Bouncing penguin logo** with CSS animations
- **Floating penguin button** effects
- **Working penguin animation** during video generation
- **Penguin-themed color scheme** throughout
- **Playful console messages** with penguin emojis
- **Status indicators** with penguin-themed styling

## 🔒 Security Features

- **File validation**: Only image files accepted
- **Size limits**: 10MB maximum file size
- **CORS protection**: Configurable origin restrictions
- **Error handling**: Comprehensive error management
- **Environment isolation**: API keys stored securely

## 🐛 Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Ensure you've created `.env` file from `.env.example`
   - Add your actual `DASHSCOPE_API_KEY` to the `.env` file
   - Restart the server

2. **"Cannot connect to server"**
   - Make sure the server is running (`npm start` or `npm run dev`)
   - Check if port 3000 is available
   - Verify the server started without errors

3. **File upload issues**
   - Supported formats: JPG, PNG, GIF, WebP
   - Maximum file size: 10MB
   - Try refreshing the page if upload fails

4. **Video generation fails**
   - Check your internet connection
   - Verify API key is correct and has proper permissions
   - Check server logs for detailed error messages

### Development Tips

- Use `npm run dev` for development with auto-restart
- Check browser console for frontend errors
- Check terminal/console for backend errors
- Monitor the `/api/health` endpoint for server status

## 🎉 What's Different from the Previous Version

- **Full Node.js backend** instead of client-side only
- **Real API integration** with Wan2.5-I2V-Preview
- **Environment-based configuration** - just add your API key to `.env`
- **File upload handling** with proper validation
- **Progress tracking** with real-time status updates
- **Video download** functionality
- **Error handling** and user feedback
- **Production-ready** architecture

## 🚀 Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in your `.env`
2. Configure proper CORS origins
3. Set up proper file storage (consider cloud storage)
4. Add logging and monitoring
5. Use a process manager like PM2

## 🎨 Customization

The application is designed to be easily customizable:

- **Colors**: Modify CSS custom properties in `public/styles.css`
- **Animations**: Adjust keyframes and transitions
- **API endpoints**: Extend the Express routes in `server.js`
- **File handling**: Modify multer configuration
- **UI components**: Update HTML structure in `public/index.html`

---

*Made with 🐧 love and Node.js magic!*

**Ready to transform images into videos? Just add your API key and start creating! 🎬✨**
