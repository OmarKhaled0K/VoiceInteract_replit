// Main application JavaScript for voice conversation app (Flask version)

// Global variables
let recognition = null;
let isRecording = false;
let audioQueue = [];
let isPlaying = false;
let finalTranscript = '';
let recognitionSupported = false;
let silenceTimer = null;
let lastSpeechTime = 0;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Check if speech recognition is supported
    checkSpeechRecognitionSupport();
    
    // Set up UI elements
    setupButtons();
    
    // Check if API keys are configured
    checkApiKeys();
    
    // Update status
    updateStatus('Ready');
}

// Check if the browser supports speech recognition
function checkSpeechRecognitionSupport() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showMessage('Speech recognition is not supported in this browser. Please try Chrome or Edge.', 'warning');
        document.getElementById('playButton').disabled = true;
        recognitionSupported = false;
    } else {
        recognitionSupported = true;
    }
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

// Start recording from the microphone using Web Speech API
function startRecording() {
    if (isRecording || !recognitionSupported) return;
    
    try {
        // Set up the SpeechRecognition object
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        // Configure recognition settings
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        // Reset transcription
        finalTranscript = '';
        
        // Set up recognition event handlers
        recognition.onstart = () => {
            console.log('Speech recognition started');
            isRecording = true;
            updateStatus('Listening... Speak now!');
            
            // Update UI
            document.getElementById('playButton').disabled = true;
            document.getElementById('stopButton').disabled = false;
            
            // Clear previous transcriptions
            document.getElementById('transcriptionText').textContent = '';
            document.getElementById('aiResponseText').textContent = '';
        };
        
        recognition.onresult = (event) => {
            let interimTranscript = '';
            
            // Process the results
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                
                // Update the last speech time
                lastSpeechTime = Date.now();
                
                // Clear any existing silence timer
                if (silenceTimer) {
                    clearTimeout(silenceTimer);
                    silenceTimer = null;
                }
                
                if (event.results[i].isFinal) {
                    finalTranscript += ' ' + transcript;
                    // Update with final result
                    updateTranscript(finalTranscript.trim(), false);
                    
                    // Start the silence timer - process after 500ms of silence
                    silenceTimer = setTimeout(() => {
                        if (isRecording && finalTranscript.trim()) {
                            // Temporarily suspend recording while processing
                            const currentTranscript = finalTranscript.trim();
                            pauseRecording();
                            processTranscription(currentTranscript).then(() => {
                                // Clear the transcript and resume listening
                                if (isRecording) {
                                    finalTranscript = '';
                                    updateTranscript('', false);
                                }
                            });
                        }
                    }, 500);
                } else {
                    interimTranscript += transcript;
                    // Update with interim result
                    updateTranscript(interimTranscript, true);
                }
            }
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            showMessage(`Speech recognition error: ${event.error}`, 'error');
            stopRecording();
        };
        
        recognition.onend = () => {
            // This can trigger when the user stops speaking or on errors
            // We'll handle the actual stop in the stopRecording function
            if (isRecording) {
                // If we're still in recording mode but recognition stopped,
                // restart it to keep listening
                recognition.start();
            }
        };
        
        // Start speech recognition
        recognition.start();
        
    } catch (error) {
        console.error('Error starting speech recognition:', error);
        showMessage(`Could not start speech recognition: ${error.message}`, 'error');
    }
}

// Pause recording temporarily
function pauseRecording() {
    try {
        // Pause the speech recognition
        if (recognition) {
            recognition.stop();
        }
        
        updateStatus('Processing your input...');
    } catch (error) {
        console.error('Error pausing recording:', error);
    }
}

// Stop recording
async function stopRecording() {
    if (!isRecording) return;
    
    try {
        // Clear any existing silence timer
        if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
        }
        
        // Stop speech recognition
        if (recognition) {
            recognition.stop();
            recognition = null;
        }
        
        // Update UI
        document.getElementById('playButton').disabled = false;
        document.getElementById('stopButton').disabled = true;
        
        isRecording = false;
        updateStatus('Processing your request...');
        
        // Process the final transcript
        if (finalTranscript.trim()) {
            await processTranscription(finalTranscript.trim());
        } else {
            showMessage('No speech detected. Please try again.', 'warning');
            updateStatus('Ready');
        }
        
    } catch (error) {
        console.error('Error stopping recording:', error);
        showMessage(`Error stopping recording: ${error.message}`, 'error');
        updateStatus('Ready');
    }
}

// Process the transcription and continue the conversation flow
async function processTranscription(text) {
    try {
        // Get response from OpenAI
        updateStatus('Getting AI response...');
        const openaiResponse = await fetch('/api/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
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
