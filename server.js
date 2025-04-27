const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

const { OpenAI } = require('openai');

app.use(express.json());
app.use(express.static('public'));

const ElevenLabs = require('elevenlabs-node');


const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');




require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Get from platform.openai.com
  });

// Initialize ElevenLabs (replace with your API key)
const voice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY, // Get from https://elevenlabs.io
    voiceId: "EXAVITQu4vr4xnSDxMaL" // Default voice ID
});

const pirateVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "PPzYpIqttlTYA83688JI" // Example pirate voice ID
});

// Add this new endpoint
app.post('/api/generate-speech', async (req, res) => {
    const { text, style } = req.body; // Add style parameter
    
    try {
        // Use pirate voice if style is pirate, otherwise default voice
        const voiceToUse = style === "pirate" ? pirateVoice : voice;
        
        const audioStream = await voiceToUse.textToSpeechStream({
            textInput: text,
            stability: style === "pirate" ? 0.7 : 0.5, // More stability for pirate
            similarityBoost: style === "pirate" ? 0.8 : 0.5, // More character
            style: style === "pirate" ? 1 : 0 // More exaggerated delivery
        });
        
        res.setHeader('Content-Type', 'audio/mpeg');
        audioStream.pipe(res);
    } catch (error) {
        console.error("TTS Error:", error);
        res.status(500).json({ error: "TTS generation failed" });
    }
});


app.post('/api/generate-image', async (req, res) => {
    const { event, style } = req.body;
  
    try {
        const prompt = `Historical ${style} style depiction of ${event}, simple coloring book style, line drawing`;
        
        // Correct DALL-E 2 parameters:
        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            size: "256x256", // Only supported sizes: 256x256, 512x512, 1024x1024
            n: 1,
            // Remove 'quality' parameter completely
            response_format: "url" // Explicitly request URL format
        });

        res.json({ 
            imageUrl: response.data[0].url 
        });
        
    } catch (error) {
        console.error("DALL-E Error:", error);
        res.status(500).json({ 
            error: "Image generation failed",
            details: error.message 
        });
    }
});


app.post('/api/describe-event', async (req, res) => {
    const { event, style } = req.body;
  
    // Base rules for ALL styles
    let prompt = `Describe "${event}" in ${style} style. Rules:\n` +
                 `- No asterisks or quotation marks for emphasis\n` +
                 `- Use era-appropriate slang naturally\n` +
                 `- 1 concise paragraph (1-2 sentences)\n` +
                 `- Avoid modern terms unless style specifies\n\n` +
                 `Slang Library to Use:\n`;
  
    // Style-specific slang libraries
    switch(style) {
      case "brainrot":
        prompt += `GEN Z SLANG: yeet, cap/no cap, slay, vibes, rizz, W/L (win/lose), ` +
                  `based, cringe, sus, bussin', main character energy, glow-up, ` +
                  `touch grass, extra, ate (and left no crumbs), delulu, ` +
                  `it's giving ___ , sigma, skibidi, fanum tax\n` +
                  `Example: "The revolution was that sigma glow-up moment when they ` +
                  `ate and left no crumbs - total main character energy ✨"`;
        break;
        
      case "pirate":
        prompt += `PIRATE TERMS: avast, ahoy, belay, bilge rat, black spot, ` +
                  `booty, doubloons, hearties, hornswoggle, jolly roger, ` +
                  `landlubber, scallywag, shiver me timbers, splice the mainbrace, ` +
                  `walk the plank, yo-ho-ho\n` +
                  `Example: "Avast ye! The scurvy dogs of nobility got ` +
                  `hornswoggled proper when the peasants showed their teeth."`;
        break;
  
      case "old_english":
        prompt += `ARCHAIC TERMS: thee/thou, whence, hither/thither, verily, ` +
                  `forsooth, betwixt, ere, oft, perchance, mayhap, whence, ` +
                  `wherefore, hark, privy, beseech\n` +
                  `Example: "Hark! Whence the tyrant did falter, verily ` +
                  `the commons arose with righteous fury most profound."`;
        break;
  
      case "shakespeare":
        prompt += `SHAKESPEAREAN: dost/thou art, fie, zounds, wherefore, ` +
                  `prithee, mark me, by my troth, knave, varlet, ` +
                  `star-crossed, all the world's a stage, ` +
                  `[animal] comparisons (fox, serpent, dove)\n` +
                  `Example: "Fie upon the king! Like serpents ` +
                  `cloaked in flowers did the people strike."`;
        break;
  
      case "valley_girl":
        prompt += `VALLEY SLANG: like, totally, fer sure, whatever, ` +
                  `as if, gag me, grody, hella, tubular, bitchin', ` +
                  `psyche, barf out, mall rat, valley girl inflection (upspeak)\n` +
                  `Example: "So like, the king was all 'I rule everything' ` +
                  `and the people were like, AS IF, and then totally ` +
                  `yeeted him out?"`;
        break;
  
      case "tech_bro":
        prompt += `TECH JARGON: disrupt, pivot, synergy, blockchain, agile, ` +
                  `bandwidth, deep dive, growth hacking, ideate, ` +
                  `move fast and break things, paradigm shift, ` +
                  `rockstar/ninja, scalable, thought leader\n` +
                  `Example: "The peasants executed a perfect pivot from ` +
                  `feudalism to democracy, disrupting the monarchy space ` +
                  `with open-source governance protocols."`;
        break;
  
      case "noir":
        prompt += `NOIR PHRASES: dame, joe, gat, flatfoot, ` +
                  `the big sleep, gumshoe, juice joint, ` +
                  `"it was darker than a banker's heart", ` +
                  `whiskey-voiced, smoke-filled rooms\n` +
                  `Example: "It was rainin' revolution that night - ` +
                  `the kind of rain that washes away blood but not memories. ` +
                  `The king never saw the knife coming."`;
        break;
    }
  
    try {
      const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
        model: "deepseek-chat",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: style === "noir" ? 0.5 : 0.7 // Lower temp for noir's serious tone
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
  
      res.json({ 
        description: response.data.choices[0].message.content 
      });
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      res.status(500).json({ error: "API request failed" });
    }
  });


  app.post('/api/generate-video', async (req, res) => {
    const { imageUrl, text, style } = req.body;
    
    try {
        // 1. Get the audio stream
        const audioResponse = await fetch('http://localhost:3000/api/generate-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, style })
        });
        
        if (!audioResponse.ok) throw new Error('Failed to generate audio');
        const audioArrayBuffer = await audioResponse.arrayBuffer();
        const audioBuffer = Buffer.from(audioArrayBuffer);

        // 2. Download the image
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        
        // 3. Create temp files
        const tempDir = tmpdir();
        const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        const imagePath = path.join(tempDir, `image-${Date.now()}.png`);
        const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        
        await Promise.all([
            fs.promises.writeFile(audioPath, audioBuffer),
            fs.promises.writeFile(imagePath, imageBuffer)
        ]);

        // 4. Get audio duration using ffprobe
        const audioDuration = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) reject(err);
                resolve(metadata.format.duration);
            });
        });

        // 5. Create video with FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg()
                // Loop the image for the duration of the audio
                .input(imagePath)
                .inputOptions([
                    '-loop 1',
                    `-t ${audioDuration}`
                ])
                // Add the audio
                .input(audioPath)
                .outputOptions([
                    '-c:v libx264',
                    '-tune stillimage',
                    '-c:a aac',
                    '-b:a 192k',
                    '-pix_fmt yuv420p',
                    '-shortest',
                    // Set the video to match audio duration
                    `-t ${audioDuration}`
                ])
                .output(videoPath)
                .on('end', () => {
                    console.log(`Video generation completed. Duration: ${audioDuration}s`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });
        
        // 6. Read the video file and send it
        const videoBuffer = await fs.promises.readFile(videoPath);
        
        // 7. Clean up temp files
        await Promise.all([
            fs.promises.unlink(audioPath).catch(console.error),
            fs.promises.unlink(imagePath).catch(console.error),
            fs.promises.unlink(videoPath).catch(console.error)
        ]);
        
        // 8. Send the video
        res.setHeader('Content-Type', 'video/mp4');
        res.send(videoBuffer);
        
    } catch (error) {
        console.error("Video generation error:", error);
        res.status(500).json({ 
            error: "Video generation failed",
            details: error.message 
        });
    }
});



app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));