import os
import json
import base64
import logging
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI
from dotenv  import load_dotenv
# Load environment variables from .env file
load_dotenv()
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__, static_folder="static", template_folder="templates")

# Enable CORS
CORS(app)

# Get API keys from environment variables
SPEECHMATICS_API_KEY = os.environ.get("SPEECHMATICS_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('static', path)

@app.route('/api/check-keys', methods=['GET'])
def check_keys():
    """Check if all required API keys are available"""
    keys_status = {
        'speechmatics': bool(SPEECHMATICS_API_KEY),
        'openai': bool(OPENAI_API_KEY),
        'elevenlabs': bool(ELEVENLABS_API_KEY)
    }
    return jsonify(keys_status)

@app.route('/api/openai', methods=['POST'])
def openai_completion():
    """Get a response from OpenAI GPT"""
    if not OPENAI_API_KEY:
        return jsonify({'error': 'OpenAI API key not found'}), 500
    
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # Do not change this unless explicitly requested by the user
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful, conversational AI assistant. Provide clear, concise, and friendly responses."},
                {"role": "user", "content": text}
            ],
            max_tokens=300  # Limit response length for better TTS conversion
        )
        
        return jsonify({
            'text': response.choices[0].message.content
        })
    
    except Exception as e:
        logger.error(f"Error getting OpenAI response: {str(e)}")
        return jsonify({'error': f"Failed to get AI response: {str(e)}"}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """Convert text to speech using ElevenLabs API"""
    if not ELEVENLABS_API_KEY:
        return jsonify({'error': 'ElevenLabs API key not found'}), 500
    
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        import requests
        
        # Using a default voice - you might want to make this configurable
        voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
        
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        response = requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            return jsonify({'error': f"ElevenLabs API error: {response.text}"}), 500
        
        # Convert to base64 for sending over API
        audio_base64 = base64.b64encode(response.content).decode('utf-8')
        
        return jsonify({
            'audio': audio_base64
        })
    
    except Exception as e:
        logger.error(f"Error getting ElevenLabs speech: {str(e)}")
        return jsonify({'error': f"Failed to convert response to speech: {str(e)}"}), 500

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    """Mock endpoint for speech to text since we don't have WebSockets in this basic version"""
    if not SPEECHMATICS_API_KEY:
        return jsonify({'error': 'Speechmatics API key not found'}), 500
    
    try:
        # For a full implementation, this would require WebSockets
        # In this simplified version, we'll provide a dummy response
        return jsonify({
            'status': 'Real-time transcription requires WebSockets, not available in the basic version',
            'text': 'This is a dummy transcription. In a full implementation, this would be the transcribed text from Speechmatics API.'
        })
    
    except Exception as e:
        logger.error(f"Error with speech to text: {str(e)}")
        return jsonify({'error': f"Failed to process speech to text: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)