# Installation Guide

This guide provides detailed instructions for setting up and running the Voice Conversation Web App on your local machine.

## Dependencies

To run this application, you'll need to install the following Python packages:

```bash
pip install flask==2.3.3
pip install flask-cors==4.0.0
pip install gunicorn==23.0.0  # Optional for production deployment
pip install openai==1.14.0
pip install requests==2.31.0
pip install python-dotenv==1.0.0  # Optional for .env file support
```

Or use this one-line command to install everything:

```bash
pip install flask==2.3.3 flask-cors==4.0.0 gunicorn==23.0.0 openai==1.14.0 requests==2.31.0 python-dotenv==1.0.0
```

## Setting Up API Keys

You'll need API keys for external services. You can set these up in one of two ways:

### Option 1: Environment Variables

Set the following environment variables:

#### On Windows (Command Prompt):
```
set OPENAI_API_KEY=your_openai_key_here
set ELEVENLABS_API_KEY=your_elevenlabs_key_here
set SPEECHMATICS_API_KEY=your_speechmatics_key_here
```

#### On Windows (PowerShell):
```
$env:OPENAI_API_KEY="your_openai_key_here"
$env:ELEVENLABS_API_KEY="your_elevenlabs_key_here"
$env:SPEECHMATICS_API_KEY="your_speechmatics_key_here"
```

#### On macOS/Linux:
```
export OPENAI_API_KEY=your_openai_key_here
export ELEVENLABS_API_KEY=your_elevenlabs_key_here
export SPEECHMATICS_API_KEY=your_speechmatics_key_here
```

### Option 2: Create a .env File (Requires python-dotenv)

Create a file named `.env` in the project root with the following content:

```
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
SPEECHMATICS_API_KEY=your_speechmatics_key_here
```

Note: If using this method, you'll need to add this code to the beginning of app.py:

```python
from dotenv import load_dotenv
load_dotenv()
```

## Running the Application

### Development Mode

Start the application using Flask's built-in server:

```bash
flask run --host=0.0.0.0 --port=5000
```

### Production Mode (Linux/macOS)

For production environments, use Gunicorn:

```bash
gunicorn --bind 0.0.0.0:5000 main:app
```

## Troubleshooting

### Common Issues

1. **API Key Errors**: Make sure your API keys are correctly set and valid
2. **Microphone Access**: Ensure your browser has permission to access your microphone
3. **Speech Recognition Issues**: Try using Chrome or Edge, which have better Web Speech API support
4. **Port Already in Use**: If port 5000 is in use, change to another port using `--port=5001`

### Browser Compatibility

The Web Speech API has varying support across browsers:
- Chrome: Excellent support
- Edge: Good support
- Firefox: Limited support
- Safari: Limited support

For best results, use Chrome or Edge.

## Obtaining API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new secret key

### ElevenLabs API Key
1. Visit [ElevenLabs](https://elevenlabs.io/)
2. Create an account
3. Go to your profile settings
4. Find your API key in the API section

### Speechmatics API Key (if needed)
1. Go to [Speechmatics](https://www.speechmatics.com/)
2. Sign up for an account
3. Navigate to your account settings
4. Locate your API key