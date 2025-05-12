const express = require('express');
const axios = require('axios');

const assParser = require('ass-parser');
const assStringify = require('ass-stringify');

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

const brainrotVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "pNInz6obpgDQGcFmaJgB"
});

const italianBrainrotVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "pNInz6obpgDQGcFmaJgB" 
});

const pirateVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "PPzYpIqttlTYA83688JI"
});

const shakespeareVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "qg9068uIPhh2zLXgBEgX"
});

const africanAmericanVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "6OzrBCQf8cjERkYgzSg8"
});

const storytellerVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "dPah2VEoifKnZT37774q"
});

const ukrainianManVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "BEprpS2vpgM32yNJpTXq"
});

const matterOfFactVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "dPah2VEoifKnZT37774q"
});


function getVoiceSettings(style) {
    switch(style) {
        case "brainrot":
            return {
                voiceId: brainrotVoice.voiceId,
                params: {
                    stability: 1,
                    similarity_boost: 1,
                    style: 1,
                    speed: 0.9
                }
            };
            
        case "italian_brainrot":
            return {
                voiceId: italianBrainrotVoice.voiceId,
                params: {
                    stability: 0.3,
                    similarity_boost: 0.7,
                    speed: 0.95,
                    speaker_boost: true
                }
            };
            
        case "pirate":
            return {
                voiceId: pirateVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 1
                }
            };
            
        case "shakespeare":
            return {
                voiceId: shakespeareVoice.voiceId,
                params: {
                    stability: 0.6,
                    similarity_boost: 0.75,
                    style: 0,
                    speed: 0.9
                }
            };
            
        case "african_american":
            return {
                voiceId: africanAmericanVoice.voiceId,
                params: {
                    stability: 0.5,
                    similarity_boost: 0.7,
                    style: 0,
                    speed: 0.9
                }
            };

        case "ukrainian_man":
            return {
                voiceId: ukrainianManVoice.voiceId,
                params: {
                    stability: 0.4,
                    similarity_boost: 0.8,
                    style: 0.7,
                    speed: 0.8,
                    speaker_boost: true
                }
            };

        case "matter_of_fact":
            return {
                voiceId: matterOfFactVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.95
                }
            };
            
        case "storyteller":
            default:
            return {
                voiceId: storytellerVoice.voiceId,
                params: {
                    stability: 0.7,
                    similarity_boost: 0.8,
                    style: 0,
                    speed: 0.9
                }
            };
            
    }
}

function removeAsterisks(text) {
    // Remove all asterisks and any extra spaces they might leave
    return text.replace(/\*/g, '').replace(/\s{2,}/g, ' ').trim();
}

function cleanText(text) {
    return text
        .replace(/[*_#/]/g, ' ')  // Only replace specific formatting chars
        .replace(/\[.*?\]/g, '')   // Remove text in brackets
        .replace(/\s{2,}/g, ' ')   // Collapse multiple spaces into one
        .trim();
}

// Add this new endpoint
app.post('/api/generate-speech', async (req, res) => {
    const { text, style } = req.body;
    
    try {
        // Pre-process text
        const cleanText = cleanText(text);

        // Get voice settings
        const { voiceId, params } = getVoiceSettings(style);

        // Make API call to ElevenLabs with timestamps
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
            {
                text: cleanText,
                model_id: "eleven_monolingual_v1",
                voice_settings: params
            },
          {
              headers: {
                  'xi-api-key': process.env.ELEVENLABS_API_KEY,
                  'Content-Type': 'application/json'
              },
              responseType: 'json'
          }
      );

      // [Rest of your existing code...]
      const audioBuffer = Buffer.from(response.data.audio_base64, 'base64');
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(audioBuffer);
      
  } catch (error) {
      console.error("TTS Error:", error.response?.data || error.message);
      res.status(500).json({ error: "TTS generation failed" });
  }
});


app.post('/api/generate-image', async (req, res) => {
    const { event, style } = req.body;
  
    try {
        //const prompt = `Historical ${style} style depiction of ${event}`;

        const prompt = `Realistic high quality photo depiction of historical event: ${event}`;
        
        //  DALL-E parameters:
        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt+", in an educational, and historical style, with no graphic content",
            //quality: "hd", //remove when using dall-e-2
            //style: "natural", //natural or vivid (dall-e-3 only)
            size: "256x256", // Only supported sizes: 256x256, 512x512, 1024x1024
            n: 1,
            response_format: "url"
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
                 `- No asterisks or dashes (-)\n` +
                 `- Don't use quotation marks\n` +
                 `- Don't use asterisks\n` +
                 `- do not answer with asterisks in any case. never use asterisks in the answer.\n` +
                 `- Use era-appropriate slang naturally\n` +
                 //`- 1 concise paragraph (2-3 sentences)\n` +
                 `- 1 sentence (9-13 words)\n` +
                 //`- just describe it in 3 words\n` +
                 `Style and Dialect Library to Use:\n`;
  
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

        case "italian_brainrot":
            prompt += `ITALIAN BRAINROT MODE:\n` +
                      `Generate completely unpredictable Italian nonsense that:\n` +
                      `1. When mentioning the event, instead make up another name for it without giving an explanation (e.g. "american civil war" could transform into "guerralina civilerina americananina". be more creative. dont use quotation marks for this.)\n` +
                      `2. Mash together food references and historical facts randomly\n` +
                      `3. Create absurd non-sequiturs that sound like drunk folk tales\n` +
                      `4. Use broken Italian mixed with modern slang however you want\n` +
                      `5. Include at least one completely made-up word or phrase\n` +
                      `6. Rhyme accidentally then abandon the rhyme scheme mid-sentence\n` +
                      `7. Reference Italian pop culture in wrong contexts\n` +
                      `8. End with an abrupt nonsense conclusion\n` +
                      `NO RULES. NO PATTERNS. PURE CHAOS.`;
            break;

        case "pirate":
            prompt += `PIRATE TERMS: avast, ahoy, belay, bilge rat, black spot, ` +
                      `booty, doubloons, hearties, hornswoggle, jolly roger, ` +
                      `landlubber, scallywag, shiver me timbers, splice the mainbrace, ` +
                      `walk the plank, yo-ho-ho\n` +
                      `Example: "Avast ye! The scurvy dogs of nobility got ` +
                      `hornswoggled proper when the peasants showed their teeth."`;
            break;
            
        case "shakespeare":
            prompt += `SHAKESPEAREAN: dost/thou art, fie, zounds, wherefore, ` +
                      `prithee, mark me, by my troth, knave, varlet, ` +
                      `star-crossed, all the world's a stage, ` +
                      `[animal] comparisons (fox, serpent, dove)\n` +
                      `Example: "Fie upon the king! Like serpents ` +
                      `cloaked in flowers did the people strike."`;
            break;
            
        case "hood_slang":
            prompt += `Use AUTHENTIC HOOD SLANG / AAVE: ` +
                    `finna, cap/no cap, woke, deadass, extra, fam, flex, ` +
                    `glow up, lit, on god, pull up, slide, vibes, y’all, bet, ` +
                    `lowkey, sus, bussin, real one, ten toes, trap, drip\n` +
                    `Sound confident, unfiltered, and like you're speakin' from the block — keep it real.\n` +
                    `Example: "Deadass, them brothas was tired of the king flexin' on the people. ` +
                    `So they pulled up, ten toes, said 'on god,' and made that brotha step down."`;
            break;
            
        case "ukrainian_man":
            prompt += `ukrainian MAN SPEAKING ENGLISH:\n` +
                    `- Make it funny, very funny, add jokes, add layer of sarcasm, add stoic humour.\n` +
                    `- Heavy ukrainian accent (write phonetically: "v" instead of "w", "z" instead of "th")\n` +
                    `- Typical ukrainian expressions\n` +
                    `- Vodka references\n` +
                    `- Slightly broken grammar: "Is not problem", "What this nonsense?", others...`;
            break;


        case "matter_of_fact":
            prompt = `Describe "${event}" in a strictly factual, educational tone. Rules:\n` +
                    `do not use asterisks in the response (*) \n` +
                    `- Use neutral, academic language\n` +
                    `- Present facts only\n` +
                    `- Avoid opinions, humor, or dramatic language\n` +
                    `- Maintain objective perspective\n` +
                    `- Use proper historical terminology\n` +
                    `Example: "${event} occurred in [year] when [key actors] [actions], resulting in [outcome]. This event is significant because [historical impact]."\n\n` +
                    `Additional Guidelines:\n` +
                    `- Cite dates when known\n` +
                    `- Mention primary actors/parties involved\n` +
                    `- Note immediate consequences\n` +
                    `- Reference broader historical significance\n` +
                    `- Avoid colloquialisms and metaphors`;
            break;
            
        case "storyteller":
            prompt += `WISE STORYTELLER STYLE ` +
                      `proverbs, circular storytelling\n` +
                      `when the people rose up, ` +
                      `it was like the river breaking its banks - unstoppable ` +
                      `yet natural, as all great changes must be."`;
            break;
    }
  
    try {
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: "deepseek-chat",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Clean the response text
        const cleanDescription = removeAsterisks(response.data.choices[0].message.content);
        
        res.json({ 
            description: cleanDescription 
        });
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "API request failed" });
    }
});




  function secondsToAssTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const centiseconds = Math.floor((secs - Math.floor(secs)) * 100);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}




  app.post('/api/generate-video', async (req, res) => {
    const { imageUrl, text, style } = req.body;
    
    try {
        // Get voice settings
        const { voiceId, params } = getVoiceSettings(style);

        // 1. Get the audio stream WITH TIMESTAMPS
        const audioResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
            {
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: params
            },
            {
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                responseType: 'json'
            }
        );

        const audioBuffer = Buffer.from(audioResponse.data.audio_base64, 'base64');
        const alignment = audioResponse.data.alignment;

        // 2. Precise timestamp-based phrase splitting
        const phrases = [];
        let currentPhrase = {
            text: '',
            words: [],
            start: null,
            end: 0
        };

        // Track current word with precise timings
        let currentWord = {
            text: '',
            start: null,
            end: 0,
            chars: []
        };

        alignment.characters.forEach((char, index) => {
            const charStart = alignment.character_start_times_seconds[index];
            const charEnd = alignment.character_end_times_seconds[index];

            // Build current word
            if (char !== ' ') {
                if (currentWord.text === '') {
                    currentWord.start = charStart;
                }
                currentWord.text += char;
                currentWord.end = charEnd;
                currentWord.chars.push({ char, start: charStart, end: charEnd });
                return;
            }

            // Finalize current word if exists
            if (currentWord.text) {
                currentPhrase.words.push({
                    text: currentWord.text,
                    start: currentWord.start,
                    end: currentWord.end
                });
                
                if (currentPhrase.start === null) {
                    currentPhrase.start = currentWord.start;
                }
                currentPhrase.end = currentWord.end;
                
                currentWord = { text: '', start: null, end: 0, chars: [] };
            }

            // Finalize phrase at sentence boundaries
            if (char === '.' || char === '!' || char === '?') {
                if (currentPhrase.words.length > 0) {
                    currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
                    phrases.push({ ...currentPhrase });
                    currentPhrase = { text: '', words: [], start: null, end: 0 };
                }
            }
        });

        // Handle final word/phrase if exists
        if (currentWord.text) {
            currentPhrase.words.push({
                text: currentWord.text,
                start: currentWord.start,
                end: currentWord.end
            });
            if (currentPhrase.start === null) {
                currentPhrase.start = currentWord.start;
            }
            currentPhrase.end = currentWord.end;
        }
        if (currentPhrase.words.length > 0) {
            currentPhrase.text = currentPhrase.words.map(w => w.text).join(' ');
            phrases.push({ ...currentPhrase });
        }

        // Now split long phrases while preserving original timestamps
        const finalPhrases = [];
        phrases.forEach(phrase => {
          // Calculate average word length in this phrase
          const avgWordLength = phrase.words.reduce((sum, word) => sum + word.text.length, 0) / phrase.words.length;
          
          // Determine max words based on average length
          let maxWords;
          if (avgWordLength > 4) {
              maxWords = 3; // Very long words - max 3 words per segment
          } else if (avgWordLength > 2) {
              maxWords = 4; // Medium-long words - max 4 words
          } else {
              maxWords = 5; // Short words - up to 5 words
          }
      
          // If phrase is short enough, keep as-is
          if (phrase.words.length <= maxWords) {
              finalPhrases.push(phrase);
              return;
          }
      
          // Split long phrases using original word timestamps
          let currentSegment = {
              text: '',
              words: [],
              start: phrase.words[0].start,
              end: phrase.words[0].end
          };
      
          phrase.words.forEach((word, i) => {
              // Start new segment if current one would exceed max words
              if (currentSegment.words.length >= maxWords) {
                  currentSegment.text = currentSegment.words.map(w => w.text).join(' ');
                  finalPhrases.push({ ...currentSegment });
                  
                  currentSegment = {
                      text: '',
                      words: [],
                      start: word.start,
                      end: word.end
                  };
              }
      
              currentSegment.words.push(word);
              currentSegment.end = word.end;
          });
      
          // Add final segment
          if (currentSegment.words.length > 0) {
              currentSegment.text = currentSegment.words.map(w => w.text).join(' ');
              finalPhrases.push({ ...currentSegment });
          }
      });




    /*  console.log("\n=== RAW TIMING DATA ===");
console.log("Alignment Data:", JSON.stringify(alignment, null, 2));

if (alignment) {
    console.log("\nCharacter-level details:");
    console.log("Characters:", alignment.characters.join(''));
    console.log("Start Times:", alignment.character_start_times_seconds);
    console.log("End Times:", alignment.character_end_times_seconds);
    
    // Print character-by-character timeline
    //console.log("\nDetailed Timeline:");
    alignment.characters.forEach((char, i) => {
        console.log(`[${alignment.character_start_times_seconds[i].toFixed(3)}s-${alignment.character_end_times_seconds[i].toFixed(3)}s] '${char}'`);
    });
}*/





        //console.log("Final phrases with precise timings:", finalPhrases);

        const totalDuration = finalPhrases[finalPhrases.length - 1].end;

        // 3. Download the image
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        
        // 4. Create temp files
        const tempDir = tmpdir();
        const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        const imagePath = path.join(tempDir, `image-${Date.now()}.png`);
        const upscaledImagePath = path.join(tempDir, `upscaled-image-${Date.now()}.png`);
        const paddedImagePath = path.join(tempDir, `padded-image-${Date.now()}.png`);
        const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        
        await Promise.all([
            fs.promises.writeFile(audioPath, audioBuffer),
            fs.promises.writeFile(imagePath, imageBuffer)
        ]);

        // 5. Upscale and pad the image (FIXED VERSION)
await new Promise((resolve, reject) => {
    ffmpeg()
        .input(imagePath)
        .complexFilter([
            // Combine scaling and padding in a single filter chain
            {
                filter: 'scale',
                options: {
                    w: 1080,
                    h: 1080,
                    flags: 'lanczos'
                },
                outputs: 'scaled'
            },
            {
                filter: 'pad',
                options: {
                    width: 1080,
                    height: 1920,
                    x: 0,
                    y: '(oh-ih)/2',
                    color: 'black'
                },
                inputs: 'scaled',
                outputs: 'padded'
            }
        ])
        .outputOptions([
            '-map', '[padded]'  // Explicitly map the output of the pad filter
        ])
        .output(paddedImagePath)
        .on('end', resolve)
        .on('error', reject)
        .run();
});

      // 6. Generate ASS subtitles manually
function generateAssSubtitles(phrases) {
    let assContent = `[Script Info]
Title: Karaoke Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Roboto Black,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,1,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    phrases.forEach(phrase => {
        // First process words to get correct end times
        const processedWords = [];
        
        for (let i = 0; i < phrase.words.length; i++) {
            const currentWord = phrase.words[i];
            let wordEnd = currentWord.end;
            
            // If there's a next word, extend this word's end time 
            // to the next word's start time (including any space)
            if (i < phrase.words.length - 1) {
                wordEnd = phrase.words[i + 1].start;
            }
            
            processedWords.push({
                text: currentWord.text,
                start: currentWord.start,
                end: wordEnd
            });
        }

        // Generate karaoke subtitles with adjusted timings
        for (let i = 0; i < processedWords.length; i++) {
            const word = processedWords[i];
            const wordStart = secondsToAssTime(word.start);
            const wordEnd = secondsToAssTime(word.end);
            
            // Skip empty words (spaces)
            if (!word.text.trim()) continue;
            
            // Create highlighted version
            let highlightedText = '';
            for (let j = 0; j < processedWords.length; j++) {
                if (j === i) {
                    highlightedText += `{\\c&H00FFFF&}${processedWords[j].text}{\\c&HFFFFFF&}`;
                } else {
                    highlightedText += processedWords[j].text;
                }
                
                if (j < processedWords.length - 1) {
                    highlightedText += ' ';
                }
            }
            
            assContent += `Dialogue: 0,${wordStart},${wordEnd},Default,,0,0,700,,${highlightedText}\n`;
        }
    });

    return assContent;
}

function secondsToAssTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const centiseconds = Math.floor((secs - Math.floor(secs)) * 100);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

// Create ASS file
const assContent = generateAssSubtitles(finalPhrases);
const assPath = path.join(tempDir, `subtitles-${Date.now()}.ass`);
await fs.promises.writeFile(assPath, assContent);

// 7. Create video with ASS subtitles (Windows-specific path handling)
const escapedAssPath = assPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
await new Promise((resolve, reject) => {
    ffmpeg()
        .input(paddedImagePath)
        .inputOptions([
            '-loop 1',
            `-t ${totalDuration}`
        ])
        .input(audioPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .complexFilter([
            `[0:v]scale=1080:1920,ass='${escapedAssPath}'[v]`
        ])
        .outputOptions([
            '-map', '[v]',
            '-map', '1:a',
            '-pix_fmt', 'yuv420p',
            '-shortest',
            '-movflags', '+faststart',
            '-r', '30'
        ])
        .output(videoPath)
        .on('end', () => {
           // console.log(`Video generated with duration: ${totalDuration}s`);
           // console.log('Phrase display sequence:');
            //finalPhrases.forEach(p => console.log(`[${p.start.toFixed(2)}s-${p.end.toFixed(2)}s]: ${p.text}`));
            resolve();
        })
        .on('error', (err) => {
            console.error('FFmpeg error:', err);
            reject(err);
        })
        .run();
});

// 8. Read and send video
const videoBuffer = await fs.promises.readFile(videoPath);

// 9. Clean up (add the ASS file to cleanup)
await Promise.all([
    fs.promises.unlink(audioPath),
    fs.promises.unlink(imagePath),
    fs.promises.unlink(paddedImagePath),
    fs.promises.unlink(videoPath),
    fs.promises.unlink(assPath)
].map(p => p.catch(console.error)));
        
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