# Real-Time Voice Conversation Web App

A real-time voice conversation web application that uses browser's Web Speech API for speech recognition, OpenAI for generating responses, and ElevenLabs for high-quality text-to-speech.

## Features

- Real-time speech recognition using Web Speech API
- Automatic response after 500ms of silence
- AI-powered responses via OpenAI GPT
- High-quality voice synthesis with ElevenLabs
- Simple and intuitive user interface
- Continuous listening mode

## Project Structure

```
├── static                 # Static assets
│   ├── css                # CSS stylesheets
│   │   └── style.css      # Main stylesheet
│   └── js                 # JavaScript files
│       └── app.js         # Main application logic
├── templates              # HTML templates
│   └── index.html         # Main page template
├── app.py                 # Flask application and API endpoints
├── main.py                # Application entry point
└── README.md              # This file
```

## Prerequisites

- Python 3.10 or higher
- Modern web browser (Chrome or Edge recommended for Web Speech API)
- API keys for:
  - OpenAI
  - ElevenLabs
  - Speechmatics (only if switching from Web Speech API to Speechmatics)

## How to Run on Your Local Machine

### 1. Download and Extract

Download the ZIP file from Replit and extract it to a folder on your computer.

### 2. Installation

For detailed installation instructions, please refer to the [INSTALL.md](INSTALL.md) file included in this project.

Here's a quick summary:

1. Set up a Python virtual environment (recommended)
2. Install the required dependencies: Flask, OpenAI, etc.
3. Set up your API keys as environment variables
4. Run the application using Flask or Gunicorn
5. Access the application at http://localhost:5000

The INSTALL.md file provides step-by-step instructions, troubleshooting tips, and advice on obtaining API keys.

## How to Use

1. Click the "Play" button to start listening
2. Speak into your microphone
3. Pause for 500ms to automatically process your speech
4. The AI will generate a response and speak it back to you
5. Continue the conversation or click "Stop" to end

## Important Notes

- Make sure your browser allows microphone access
- The Web Speech API works best in Chrome and Edge browsers
- You need an active internet connection for the OpenAI and ElevenLabs API calls
- For production deployment, you would want to set up proper security measures

## API Keys and Services

- **OpenAI**: Used for generating intelligent responses to your speech
- **ElevenLabs**: Used for high-quality text-to-speech conversion
- **Web Speech API**: Built into modern browsers for speech recognition

## License

This project is for educational purposes. All API usage is subject to the terms and conditions of the respective service providers.