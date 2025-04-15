// Main application JavaScript for voice conversation app (Flask version)

// Global variables
let mediaRecorder = null;
let audioContext = null;
let microphoneStream = null;
let isRecording = false;
let audioQueue = [];
let isPlaying = false;
let recordedChunks = [];
let dummyTranscriptionInterval = null;
let processingComplete = false;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Set up UI elements
    setupButtons();
    
    // Check if API keys are configured
    checkApiKeys();
    
    // Update status
    updateStatus('Ready');
}

// Set up button event listeners
function setupButtons() {
    const playButton = document.getElementById('playButton');
    const stopButton = document.getElementById('stopButton');
    
    playButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    
    // Initially disable stop button
    stopButton.disabled = true;
}

// Check if API keys are available
async function checkApiKeys() {
    try {
        const response = await fetch('/api/check-keys');
        const keysStatus = await response.json();
        
        let missingKeys = [];
        if (!keysStatus.speechmatics) missingKeys.push('Speechmatics');
        if (!keysStatus.openai) missingKeys.push('OpenAI');
        if (!keysStatus.elevenlabs) missingKeys.push('ElevenLabs');
        
        if (missingKeys.length > 0) {
            showMessage(`Warning: Missing API keys for: ${missingKeys.join(', ')}. Some functionality may not work.`, 'warning');
        }
    } catch (error) {
        console.error('Error checking API keys:', error);
    }
}

// Start recording from the microphone
async function startRecording() {
    if (isRecording) return;
    
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStream = stream;
        
        // Create media recorder to capture audio data
        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.start(1000); // Collect data every second
        
        // Update UI
        document.getElementById('playButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        
        // Clear previous transcriptions
        document.getElementById('transcriptionText').textContent = '';
        document.getElementById('aiResponseText').textContent = '';
        
        isRecording = true;
        updateStatus('Listening... Speak now!');
        
        // Since we don't have real-time WebSockets in this simplified version,
        // we'll simulate partial transcriptions with a timer
        simulatePartialTranscriptions();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showMessage(`Could not access microphone: ${error.message}`, 'error');
    }
}

// Simulate partial transcriptions while recording
function simulatePartialTranscriptions() {
    // Clear any existing interval
    if (dummyTranscriptionInterval) {
        clearInterval(dummyTranscriptionInterval);
    }
    
    const partialTexts = [
        'Listening...',
        'Processing audio...',
        'Recognizing speech...'
    ];
    
    let index = 0;
    dummyTranscriptionInterval = setInterval(() => {
        if (isRecording) {
            updateTranscript(partialTexts[index % partialTexts.length], true);
            index++;
        } else {
            clearInterval(dummyTranscriptionInterval);
        }
    }, 2000);
}

// Stop recording
async function stopRecording() {
    if (!isRecording) return;
    
    try {
        // Stop the recording
        mediaRecorder.stop();
        
        // Clear simulation interval
        if (dummyTranscriptionInterval) {
            clearInterval(dummyTranscriptionInterval);
            dummyTranscriptionInterval = null;
        }
        
        // Stop media streams
        if (microphoneStream) {
            microphoneStream.getTracks().forEach(track => track.stop());
            microphoneStream = null;
        }
        
        // Update UI
        document.getElementById('playButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
        
        isRecording = false;
        updateStatus('Processing your request...');
        
        // We'd normally send the audio to Speechmatics here, but we'll skip that
        // in this simplified version and use a dummy "transcription"
        
        // In a real app, we would send the audio data to the Speechmatics API
        // and get back a transcription. For now, let's simulate it:
        await processDummyTranscription();
        
    } catch (error) {
        console.error('Error stopping recording:', error);
        showMessage(`Error stopping recording: ${error.message}`, 'error');
    }
}

// Process a dummy transcription and continue the conversation flow
async function processDummyTranscription() {
    try {
        // This would be the transcribed text from Speechmatics in a real app
        const dummyText = "Hello, this is a sample transcription. Please provide a response.";
        
        // Display the "transcription"
        updateTranscript(dummyText, false);
        
        // Get response from OpenAI
        updateStatus('Getting AI response...');
        const openaiResponse = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: dummyText })
        });
        
        if (!openaiResponse.ok) {
            const error = await openaiResponse.json();
            throw new Error(error.error || 'Failed to get AI response');
        }
        
        const openaiData = await openaiResponse.json();
        const aiResponseText = openaiData.text;
        
        // Display AI response
        displayAIResponse(aiResponseText);
        
        // Convert to speech
        updateStatus('Converting response to speech...');
        const ttsResponse = await fetch('/api/text-to-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: aiResponseText })
        });
        
        if (!ttsResponse.ok) {
            const error = await ttsResponse.json();
            throw new Error(error.error || 'Failed to convert response to speech');
        }
        
        const ttsData = await ttsResponse.json();
        
        // Play audio response
        playAudioResponse(ttsData.audio);
        
        // Update status
        updateStatus('Ready');
        
    } catch (error) {
        console.error('Error processing transcription:', error);
        showMessage(`Error: ${error.message}`, 'error');
        updateStatus('Error occurred');
    }
}

// Update the status display
function updateStatus(status) {
    const statusElement = document.getElementById('statusText');
    statusElement.textContent = status;
    
    // Add a visual indicator for listening state
    if (status.includes('Listening')) {
        statusElement.classList.add('listening');
    } else {
        statusElement.classList.remove('listening');
    }
}

// Update the transcription display
function updateTranscript(text, isPartial) {
    const transcriptionElement = document.getElementById('transcriptionText');
    
    if (isPartial) {
        // For partial transcripts, update the current text
        transcriptionElement.textContent = text;
        transcriptionElement.classList.add('partial');
    } else {
        // For final transcripts, append with a new line
        const currentText = transcriptionElement.textContent;
        if (currentText && !currentText.endsWith('\n')) {
            transcriptionElement.textContent += '\n';
        }
        transcriptionElement.textContent += text;
        transcriptionElement.classList.remove('partial');
        
        // Scroll to bottom
        transcriptionElement.scrollTop = transcriptionElement.scrollHeight;
    }
}

// Display AI response
function displayAIResponse(text) {
    const responseElement = document.getElementById('aiResponseText');
    responseElement.textContent = text;
    
    // Scroll to show the response
    responseElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Play audio response from ElevenLabs
function playAudioResponse(base64Audio) {
    // Add to queue
    audioQueue.push(base64Audio);
    
    // Start playing if not already playing
    if (!isPlaying) {
        playNextInQueue();
    }
}

// Play next audio in queue
function playNextInQueue() {
    if (audioQueue.length === 0) {
        isPlaying = false;
        return;
    }
    
    isPlaying = true;
    const base64Audio = audioQueue.shift();
    
    // Convert base64 to blob
    const binaryString = window.atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
    
    // Create audio element and play
    const audio = new Audio(URL.createObjectURL(audioBlob));
    
    audio.onended = () => {
        playNextInQueue();
    };
    
    audio.onerror = (error) => {
        console.error('Error playing audio:', error);
        showMessage('Error playing audio response', 'error');
        playNextInQueue();
    };
    
    audio.play().catch(error => {
        console.error('Error playing audio:', error);
        showMessage('Could not play audio response', 'error');
        playNextInQueue();
    });
}

// Show message to user
function showMessage(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.setAttribute('role', 'alert');
    
    // Set message
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    alertContainer.appendChild(alertElement);
    
    // Remove after a delay if not an error
    if (type !== 'error') {
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.remove();
            }
        }, 5000);
    }
    
    // Initialize Bootstrap alert dismiss functionality
    const bsAlert = new bootstrap.Alert(alertElement);
}
