document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('eventForm');
    const resultDiv = document.getElementById('result');
    let lastGeneratedText = '';
    let currentAudio = null;
    let audioBlobCache = null;

    // Main generation function
    async function generateAndDisplay(event, style) {
        try {
            // Reset state
            audioBlobCache = null;
            stopPlayback();
            resultDiv.innerHTML = '<div class="spinner"></div><p>Generating description...</p>';
    
            // 1. Generate text description
            const textResponse = await fetch('/api/describe-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, style })
            });
            
            if (!textResponse.ok) throw new Error('Failed to generate description');
            const textData = await textResponse.json();
            lastGeneratedText = textData.description;
    
            // 2. Generate image
            resultDiv.innerHTML = `
                <div class="text-output">${lastGeneratedText}</div>
                <div class="spinner"></div>
                <p>Generating image...</p>
            `;
            
            const imgResponse = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, style })
            });
            
            if (!imgResponse.ok) throw new Error('Failed to generate image');
            const imgData = await imgResponse.json();
    
            // 3. Display results
            resultDiv.innerHTML = `
                <div class="text-output">${lastGeneratedText}</div>
                <div class="image-container">
                    <img src="${imgData.imageUrl}" alt="${event}" class="history-image" onerror="this.onerror=null;this.parentElement.innerHTML='<p class=\'error\'>Image failed to load</p>';">
                </div>
                <div class="spinner"></div>
                <p>Generating video...</p>
            `;
            
            // 4. Generate and display video
            const videoResponse = await fetch('/api/generate-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    imageUrl: imgData.imageUrl,
                    text: lastGeneratedText,
                    style
                })
            });
            
            if (!videoResponse.ok) throw new Error('Failed to generate video');
            
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            
            resultDiv.innerHTML = `
                <div class="text-output">${lastGeneratedText}</div>
                <div class="image-container">
                    <img src="${imgData.imageUrl}" alt="${event}" class="history-image">
                </div>
                <video controls autoplay class="history-video">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
            
        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerHTML = `
                <div class="error-alert">⚠️</div>
                <div class="error">${error.message}</div>
                ${lastGeneratedText ? `<div class="text-output">${lastGeneratedText}</div>` : ''}
            `;
        }
    }

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const event = document.getElementById('event').value.trim();
        const style = document.getElementById('style').value;
        
        if (!event || !style) {
            resultDiv.innerHTML = '<div class="error">Please fill in both fields</div>';
            return;
        }
        
        await generateAndDisplay(event, style);
    });

    // Audio controls
    function addAudioControls() {
        const existingContainer = resultDiv.querySelector('.audio-container');
        if (existingContainer) resultDiv.removeChild(existingContainer);
        
        const container = document.createElement('div');
        container.className = 'audio-container';
        
        const playButton = document.createElement('button');
        playButton.className = 'tts-button';
        playButton.textContent = '🔊 Play Audio';
        
        // Use event delegation instead of onclick
        playButton.addEventListener('click', handleAudioButtonClick);
        
        container.appendChild(playButton);
        resultDiv.appendChild(container);
    }

    function handleAudioButtonClick() {
        const playButton = document.querySelector('.tts-button');
        
        if (currentAudio && !currentAudio.paused) {
            stopPlayback();
        } else if (audioBlobCache) {
            playCachedAudio();
        } else {
            playTTS(lastGeneratedText);
        }
    }

    // TTS functions
    async function playTTS(text) {
        try {
            const style = document.getElementById('style').value;
            const playButton = document.querySelector('.tts-button');
            
            if (audioBlobCache) {
                playCachedAudio();
                return;
            }

            playButton.disabled = true;
            playButton.innerHTML = '⌛ Generating...';
            
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, style })
            });
            
            if (!response.ok) throw new Error('TTS generation failed');
            audioBlobCache = await response.blob();
            playCachedAudio();
            
        } catch (error) {
            console.error('TTS Error:', error);
            const playButton = document.querySelector('.tts-button');
            if (playButton) {
                playButton.disabled = false;
                playButton.innerHTML = '🔊 Retry Audio';
            }
            resultDiv.insertAdjacentHTML('beforeend', '<div class="error">Audio failed</div>');
        }
    }

    function playCachedAudio() {
        if (!audioBlobCache) return;
        
        stopPlayback();
        const audioUrl = URL.createObjectURL(audioBlobCache);
        currentAudio = new Audio(audioUrl);
        const playButton = document.querySelector('.tts-button');
        
        currentAudio.onplay = () => {
            if (playButton) {
                playButton.innerHTML = '⏹ Stop';
                playButton.onclick = stopPlayback;
            }
        };
        
        currentAudio.onended = () => {
            if (playButton) {
                playButton.innerHTML = '🔊 Play Again';
                playButton.onclick = () => playCachedAudio();
            }
            URL.revokeObjectURL(audioUrl);
        };
        
        currentAudio.onerror = () => {
            if (playButton) {
                playButton.innerHTML = '🔊 Retry';
                playButton.onclick = () => playTTS(lastGeneratedText);
            }
            URL.revokeObjectURL(audioUrl);
        };
        
        currentAudio.play();
    }

    function stopPlayback() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        const playButton = document.querySelector('.tts-button');
        if (playButton) playButton.textContent = '🔊 Play Audio';
    }
});