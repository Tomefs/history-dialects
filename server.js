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

const italianBrainrot = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: "pNInz6obpgDQGcFmaJgB" 
});

const pirateVoice = new ElevenLabs({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: "PPzYpIqttlTYA83688JI" // Example pirate voice ID
});

// Add this new endpoint
app.post('/api/generate-speech', async (req, res) => {
  const { text, style } = req.body;
  
  try {
      // Pre-process text to remove unwanted characters
      const cleanText = text
    .replace(/[*]/g, '')      // Remove asterisks (more explicit regex)
    .replace(/_/g, ' ')       // Replace underscores with spaces
    .replace(/#/g, '')        // Remove hash symbols
    .replace(/\[.*?\]/g, ''); // Remove any text in brackets
      
      // Select voice based on style
      let voiceToUse;
      let voiceParams = {};
      
      switch(style) {
          case "pirate":
              voiceToUse = pirateVoice;
              voiceParams = {
                  stability: 0.7,
                  similarityBoost: 0.8,
                  style: 1
              };
              break;
              
          case "italian_brainrot":
              voiceToUse = italianBrainrot;
              voiceParams = {
                  stability: 0.3,
                  similarityBoost: 0.7,
                  speed: 0.9,
                  speakerBoost: true
              };
              break;
              
          default:
              voiceToUse = voice;
              voiceParams = {
                  stability: 0.5,
                  similarityBoost: 0.5,
                  style: 0
              };
      }

      // Make API call to ElevenLabs with timestamps
      const response = await axios.post(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceToUse.voiceId}/with-timestamps`,
          {
              text: cleanText,  // Use the cleaned text here
              model_id: "eleven_monolingual_v1",
              voice_settings: voiceParams
          },
          {
              headers: {
                  'xi-api-key': process.env.ELEVENLABS_API_KEY,
                  'Content-Type': 'application/json'
              },
              responseType: 'json'
          }
      );

      // Print the timestamps to console
      console.log("Received timestamps from ElevenLabs:");
      console.log("Raw alignment data:", response.data.alignment);
      console.log("Raw normalized alignment data:", response.data.normalized_alignment);

      // Format and print character-level timestamps
      if (response.data.alignment) {
          console.log("\nCharacter-level timestamps:");
          response.data.alignment.characters.forEach((char, index) => {
              console.log(`Character: '${char}' | Start: ${response.data.alignment.character_start_times_seconds[index]}s | End: ${response.data.alignment.character_end_times_seconds[index]}s`);
          });
      }

      // Convert base64 audio to buffer and stream it
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
                 `- No asterisks or dashes (-)\n` +
                 `- Don't use quotation marks\n` +
                 `- Don't use asterisks\n` +
                 `- Use era-appropriate slang naturally\n` +
                 `- 1 concise paragraph (4-6 sentences)\n` +
                 /*`- 1 concise sentence (1-3 words)\n` +*/
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
                  `psyche, barf out, mall rat.\n` +
                  `use valley girl inflection (upspeak).\n` +
                  `do not use asterisks.\n` +
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
        // 1. Get the audio stream WITH TIMESTAMPS
        const audioResponse = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${style === 'pirate' ? pirateVoice.voiceId : 
              style === 'italian_brainrot' ? italianBrainrot.voiceId : voice.voiceId}/with-timestamps`,
            {
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: style === 'italian_brainrot' ? 0.3 : 0.5,
                    similarity_boost: style === 'italian_brainrot' ? 0.7 : 0.5
                }
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
            if (char !== ' ' && char !== ',' && char !== '.' && char !== '!' && char !== '?') {
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
          if (avgWordLength > 5) {
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

        console.log("Final phrases with precise timings:", finalPhrases);
        const totalDuration = finalPhrases[finalPhrases.length - 1].end;

        // 3. Download the image
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        
        // 4. Create temp files
        const tempDir = tmpdir();
        const audioPath = path.join(tempDir, `audio-${Date.now()}.mp3`);
        const imagePath = path.join(tempDir, `image-${Date.now()}.png`);
        const paddedImagePath = path.join(tempDir, `padded-image-${Date.now()}.png`);
        const videoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
        
        await Promise.all([
            fs.promises.writeFile(audioPath, audioBuffer),
            fs.promises.writeFile(imagePath, imageBuffer)
        ]);

        // 5. Create padded image (9:16 aspect ratio)
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(imagePath)
                .complexFilter([
                    {
                        filter: 'pad',
                        options: {
                            width: 'iw',
                            height: 'iw*16/9',
                            x: 0,
                            y: '(oh-ih)/2',
                            color: 'black'
                        }
                    }
                ])
                .output(paddedImagePath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        // 6. Generate FFmpeg filter for phrase display
        let filterChain = [];
        finalPhrases.forEach((phrase, i) => {
            const escapedText = phrase.text.replace(/'/g, "'\\''")
                                         .replace(/:/g, '\\:')
                                         .replace(/,/g, '\\,');
            
            filterChain.push(
                `drawtext=fontfile=roboto.ttf:` +
                `text='${escapedText}':` +
                `fontcolor=white:` +
                `fontsize=20:` +
                `x=(w-text_w)/2:` +
                `y=h-line_h-50:` +
                `bordercolor=black:` +
                `borderw=1:` +
                `shadowcolor=black:` +
                `shadowx=1:` +
                `shadowy=1:` +
                `enable='between(t,${phrase.start},${phrase.end})'`
            );
        });

        const drawtextFilters = `scale=256:456,${filterChain.join(',')}`;

        // 7. Create video with phrase-by-phrase display
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
                .outputOptions([
                    '-vf',
                    drawtextFilters,
                    '-pix_fmt yuv420p',
                    '-shortest',
                    '-movflags +faststart',
                    '-r 30'
                ])
                .output(videoPath)
                .on('end', () => {
                    console.log(`Video generated with duration: ${totalDuration}s`);
                    console.log('Phrase display sequence:');
                    finalPhrases.forEach(p => console.log(`[${p.start.toFixed(2)}s-${p.end.toFixed(2)}s]: ${p.text}`));
                    resolve();
                })
                .on('error', reject)
                .run();
        });
        
        // 8. Read and send video
        const videoBuffer = await fs.promises.readFile(videoPath);
        
        // 9. Clean up
        await Promise.all([
            fs.promises.unlink(audioPath),
            fs.promises.unlink(imagePath),
            fs.promises.unlink(paddedImagePath),
            fs.promises.unlink(videoPath)
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