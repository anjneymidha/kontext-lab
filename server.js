const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// API Keys - use environment variables in production
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || 'CA19NkYkjNgzptn4MB6VE553NA7s06Nh';
const BFL_API_KEY = process.env.BFL_API_KEY || '6249d98f-d557-4499-98b9-4355cc3f4a42';

// High-quality transformation prompts based on BFL prompting guide best practices
const transformationPrompts = [
  // Character transformations with preservation details
  'Change the clothing and styling to make the person look like a Muppet character while preserving their exact facial features, expression, and pose. Add fuzzy texture to clothes and bright felt-like colors.',
  'Restyle the person as a Disney animated character while maintaining their identical facial structure, eye color, and expression. Apply clean animation-style shading and vibrant colors.',
  'Change the outfit and styling to a Pixar character aesthetic while keeping the exact same face, hairstyle, and pose. Use soft 3D animation-style lighting and textures.',
  'Change the clothing to heroic character costume while preserving the person\'s identical facial features, body position, and expression. Add colorful cape and bold costume design with emblem.',
  'Change the clothes and makeup to villain styling while maintaining the exact same facial structure and pose. Add dramatic shadows and dark color scheme.',
  'Replace the clothing with futuristic robot armor while keeping the person\'s face, expression, and body position identical. Add metallic textures and glowing blue accents.',
  'Modify the styling to zombie appearance while preserving the person\'s basic facial structure and pose. Add weathered clothes and pale makeup effects.',
  'Change the outfit to vampire styling while maintaining identical facial features and expression. Add gothic clothing and dramatic lighting.',
  'Restyle as a pirate character while keeping the exact same face and pose. Add period-appropriate costume with weathered textures.',
  'Change clothing to medieval knight armor while preserving the person\'s facial features and body position. Add realistic metal textures and heraldic details.',
  
  // Style and material transformations
  'Convert the person to look like they\'re made of carved wood while maintaining their exact pose and facial structure. Add visible wood grain and natural brown tones.',
  'Transform the person to appear made of glowing neon light while preserving their identical shape and pose. Add bright electric colors and subtle luminous effects.',
  'Change the person to look like a marble statue while keeping their exact position and proportions. Add white marble texture with subtle veining.',
  'Convert to oil painting style while maintaining the identical composition and subject placement. Add visible brushstrokes and rich color depth.',
  'Change to watercolor painting style while preserving the exact scene composition. Add soft, flowing paint effects and paper texture.',
  'Convert to pencil sketch style while maintaining identical subject positioning. Add natural graphite lines and cross-hatching details.',
  'Change to clay animation style while keeping the person\'s exact pose and expression. Add smooth, matte clay textures.',
  'Convert to stained glass art style while preserving the subject\'s positioning. Add rich colors with black outlines and light transmission effects.',
  
  // Environmental and setting changes
  'Change the background to outer space while keeping the person in the exact same position, scale, and pose. Add starfield and nebula effects around them.',
  'Replace the background with underwater scene while maintaining identical subject placement and camera angle. Add floating bubbles and aquatic lighting.',
  'Change the setting to medieval castle while keeping the person in the exact same position and pose. Add stone architecture and torch lighting.',
  'Replace the background with cyberpunk cityscape while preserving the subject\'s identical positioning. Add neon lights and futuristic buildings.',
  'Change the environment to tropical jungle while maintaining the exact same subject placement and framing. Add lush vegetation and dappled lighting.',
  'Replace the background with snowy mountain landscape while keeping the person in identical position and scale. Add snow effects and crisp mountain air.',
  'Change the setting to Victorian era street while preserving the exact subject positioning and camera angle. Add period-appropriate architecture and lighting.',
  'Replace the background with alien planet surface while maintaining identical subject placement. Add strange rock formations and alien sky colors.',
  
  // Creative object transformations
  'Change the person\'s head to look like it\'s made of clouds while keeping their body position identical. Add fluffy, white cloud textures with soft lighting.',
  'Replace the person\'s clothing with flower petals while maintaining their exact pose and expression. Add vibrant floral colors and natural textures.',
  'Change the person to look like they\'re made of liquid mercury while preserving their identical shape and positioning. Add reflective, flowing metal effects.',
  'Convert the person\'s skin to look like tree bark while keeping their exact facial features and expression. Add realistic wood texture and brown tones.',
  'Change the person to appear made of ice while maintaining their identical pose and proportions. Add transparent, crystalline textures with blue tints.',
  'Replace the person\'s hair with flowing water while keeping their face and expression exactly the same. Add realistic water physics and reflections.',
  
  // Artistic and stylistic changes
  'Convert to pop art style while maintaining the exact subject positioning and composition. Add bright, contrasting colors and Ben-Day dots.',
  'Change to art nouveau style while preserving the identical scene layout. Add flowing, organic lines and decorative patterns.',
  'Convert to minimalist geometric style while keeping the subject\'s basic shape and position. Use simple shapes and limited color palette.',
  'Change to baroque painting style while maintaining the exact composition and lighting. Add rich, dramatic colors and ornate details.',
  'Convert to Japanese ukiyo-e woodblock print style while preserving the subject positioning. Add traditional colors and flowing line work.',
  'Change to surreal melting style while keeping the person\'s basic form recognizable. Add Dalí-inspired flowing and distorted elements.',
  'Convert to mosaic tile art while maintaining the identical subject placement. Add small, colorful tiles with grout lines.',
  'Change to neon light sculpture style while preserving the exact pose and proportions. Add glowing neon tubes in vibrant colors.'
];

// Guaranteed diverse prompt selection for 8 iterations
// Improved Fisher-Yates shuffle algorithm for true randomization
function fisherYatesShuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDiversePrompts() {
  // Core character transformations (these will be shuffled too)
  const characterPrompts = [
    'Change the clothing and styling to make the person look like a Muppet character while preserving their exact facial features, expression, and pose. Add fuzzy texture to clothes and bright felt-like colors.',
    'Restyle the person as a LEGO minifigure while maintaining their identical facial structure, eye color, and expression. Add plastic brick texture and bright LEGO-style colors.',
    'Transform the person into animated cartoon style with yellow skin tone and simplified features while keeping the exact same face, hairstyle, and pose. Use bold outlines and bright flat colors in classic 2D animation style.'
  ];
  
  // Extended diverse categories for maximum variety
  const diverseCategories = [
    // Material transformations
    'Transform the person to appear made of glowing neon light while preserving their identical shape and pose. Add bright electric colors and subtle luminous effects.',
    'Convert to oil painting style while maintaining the identical composition and subject placement. Add visible brushstrokes and rich color depth.',
    'Change the person to look like a marble statue while keeping their exact position and proportions. Add white marble texture with subtle veining.',
    'Convert the person to look like they\'re made of carved wood while maintaining their exact pose and facial structure. Add visible wood grain and natural brown tones.',
    'Change to clay animation style while keeping the person\'s exact pose and expression. Add smooth, matte clay textures.',
    'Make the person appear made of liquid mercury while preserving their identical shape and positioning. Add reflective, flowing metal effects.',
    
    // Environmental changes  
    'Change the background to outer space while keeping the person in the exact same position, scale, and pose. Add starfield and nebula effects around them.',
    'Replace the background with underwater scene while maintaining identical subject placement and camera angle. Add floating bubbles and aquatic lighting.',
    'Change the setting to medieval castle while keeping the person in the exact same position and pose. Add stone architecture and torch lighting.',
    'Replace the background with cyberpunk cityscape while preserving the subject\'s identical positioning. Add neon lights and futuristic buildings.',
    'Change the environment to tropical jungle while maintaining the exact same subject placement and framing. Add lush vegetation and dappled lighting.',
    'Replace the background with snowy mountain landscape while keeping the person in identical position and scale. Add snow effects and crisp mountain air.',
    
    // Artistic styles
    'Convert to stained glass art style while preserving the subject\'s positioning. Add rich colors with black outlines and light transmission effects.',
    'Change to watercolor painting style while preserving the exact scene composition. Add soft, flowing paint effects and paper texture.',
    'Convert to pencil sketch style while maintaining identical subject positioning. Add natural graphite lines and cross-hatching details.',
    'Convert to comic book style while maintaining the identical composition. Add bold outlines, halftone dots, and vibrant comic colors.',
    'Change to vintage sepia photograph style while preserving exact positioning. Add aged paper texture and antique photo effects.',
    
    // Creative transformations
    'Replace the clothing with futuristic robot armor while keeping the person\'s face, expression, and body position identical. Add metallic textures and glowing blue accents.',
    'Change the outfit to vampire styling while maintaining identical facial features and expression. Add gothic clothing and dramatic lighting.',
    'Change the clothing to heroic character costume while preserving the person\'s identical facial features, body position, and expression. Add colorful cape and bold costume design with emblem.',
    'Restyle as a pirate character while keeping the exact same face and pose. Add period-appropriate costume with weathered textures.',
    'Change clothing to medieval knight armor while preserving the person\'s facial features and body position. Add realistic metal textures and heraldic details.',
    'Modify the styling to steampunk aesthetic while maintaining identical facial features and pose. Add brass goggles, gears, and Victorian-era clothing.',
    
    // Fantasy and creature styles
    'Change the person to look like an elegant elf while preserving their exact facial structure and pose. Add pointed ears and ethereal lighting.',
    'Transform into a wise wizard appearance while keeping identical facial features and body position. Add flowing robes and magical elements.',
    'Modify to look like a fierce warrior while maintaining the exact same face and pose. Add battle-worn armor and determined expression enhancements.'
  ];
  
  // Use true randomization with Fisher-Yates shuffle
  const shuffledCharacter = fisherYatesShuffle(characterPrompts);
  const shuffledDiverse = fisherYatesShuffle(diverseCategories);
  
  // Take 3 character prompts and 5 diverse prompts, all in random order
  const selected = [
    ...shuffledCharacter.slice(0, 3),
    ...shuffledDiverse.slice(0, 5)
  ];
  
  // Final shuffle of the entire selection for completely random order
  return fisherYatesShuffle(selected);
}

// Function to get transformation prompt for specific iteration
function getTransformationPromptForIteration(iteration, allPrompts) {
  return allPrompts[iteration - 1]; // iteration is 1-based, array is 0-based
}

// Function to analyze image and get pronouns using Mistral
async function analyzeImageForPronouns(imageBuffer) {
  console.log('Calling Mistral API for image analysis...');
  
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const requestData = {
      model: "pixtral-large-2411",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Look at this image and identify the main subject. If it's a person, determine their apparent gender and respond with just the appropriate pronoun: 'he', 'she', or 'they'. If it's not a person, respond with 'it'. Be very brief - just the pronoun."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ]
    };

    const response = await axios.post('https://api.mistral.ai/v1/chat/completions', requestData, {
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const pronoun = response.data.choices[0].message.content.trim().toLowerCase();
    console.log(`Detected pronoun: ${pronoun}`);
    
    // Validate pronoun and default to 'they' if unclear
    if (['he', 'she', 'they', 'it'].includes(pronoun)) {
      return pronoun;
    } else {
      return 'they'; // Default fallback
    }
  } catch (error) {
    console.error('Error analyzing image with Mistral:', error.response?.data || error.message);
    return 'they'; // Default fallback on error
  }
}


// Function to submit image transformation request
async function submitKontextRequest(imageBuffer, prompt) {
  try {
    console.log('=== SUBMITTING KONTEXT REQUEST ===');
    console.log('Prompt:', prompt);
    console.log('Image buffer size:', imageBuffer.length, 'bytes');
    console.log('API Key:', BFL_API_KEY ? 'Present' : 'Missing');
    
    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');
    console.log('Base64 image length:', base64Image.length, 'characters');
    
    const requestData = {
      prompt: prompt,
      input_image: base64Image,
      steps: 50,
      guidance: 3.0,
      output_format: 'jpeg'
    };

    console.log('Making request to: https://api.us1.bfl.ai/v1/flux-kontext-pro');
    const response = await axios.post('https://api.us1.bfl.ai/v1/flux-kontext-pro', requestData, {
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Kontext request submitted successfully!');
    console.log('Response:', response.data);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error submitting Kontext request:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    throw error;
  }
}

// Function to check request status
async function checkKontextStatus(requestId) {
  try {
    const response = await axios.get('https://api.us1.bfl.ai/v1/get_result', {
      params: { id: requestId },
      headers: { 
        'accept': 'application/json',
        'x-key': BFL_API_KEY 
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}

// Function to process iterations
async function processIterations(imageBuffer, res, totalIterations = 8) {
  const results = [];
  const originalImageBuffer = imageBuffer; // Keep original image for all transformations
  
  // Send analysis start event
  res.write(`data: ${JSON.stringify({
    type: 'processing_start'
  })}\n\n`);
  
  // Get pronouns from initial image analysis
  const pronoun = await analyzeImageForPronouns(originalImageBuffer);
  
  // Send analysis complete event
  res.write(`data: ${JSON.stringify({
    type: 'analysis_complete'
  })}\n\n`);
  
  // Send prompts generating event
  res.write(`data: ${JSON.stringify({
    type: 'prompts_generating'
  })}\n\n`);
  
  // Generate diverse prompts for this session
  const diversePrompts = getDiversePrompts();
  console.log('Generated diverse prompts:', diversePrompts.map((p, i) => `${i+1}. ${p.substring(0, 50)}...`));
  
  // Send prompts generated event
  res.write(`data: ${JSON.stringify({
    type: 'prompts_generated'
  })}\n\n`);
  
  for (let i = 1; i <= totalIterations; i++) {
    try {
      console.log(`Starting iteration ${i}`);
      
      // Send iteration start event
      res.write(`data: ${JSON.stringify({
        type: 'iteration_start',
        iteration: i
      })}\n\n`);
      
      // Get pre-selected diverse prompt for this iteration
      let prompt = getTransformationPromptForIteration(i, diversePrompts);
      
      // Adapt prompt based on subject type (person vs object)
      if (pronoun === 'it') {
        prompt = prompt
          .replace(/the person/g, 'the subject')
          .replace(/person\'s/g, 'subject\'s')
          .replace(/their exact facial features/g, 'its original form')
          .replace(/facial structure/g, 'basic structure')
          .replace(/expression/g, 'appearance');
      }
      
      // Submit request using ORIGINAL image for each transformation
      const requestId = await submitKontextRequest(originalImageBuffer, prompt);
      
      // Poll for result
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const resultResponse = await checkKontextStatus(requestId);
        console.log(`Iteration ${i} status:`, resultResponse.status);
        
        if (resultResponse.status === 'Ready') {
          console.log(`Iteration ${i} completed successfully`);
          
          // Note: We don't download the result image since we always use the original
          // Each transformation starts fresh from the original image
          
          const result = {
            iteration: i,
            prompt: prompt,
            imageUrl: resultResponse.result.sample,
            status: 'completed'
          };
          
          results.push(result);
          
          // Send result update
          res.write(`data: ${JSON.stringify({
            type: 'iteration_complete',
            iteration: i,
            image: resultResponse.result.sample,
            prompt: prompt
          })}\n\n`);
          
          break;
        } else if (resultResponse.status === 'Content Moderated' || resultResponse.status === 'Request Moderated') {
          console.log(`Iteration ${i} moderated, moving to next prompt`);
          
          const result = {
            iteration: i,
            prompt: prompt,
            status: 'moderated',
            message: 'Content was moderated, moving to next iteration'
          };
          
          results.push(result);
          
          // Send moderated result
          res.write(`data: ${JSON.stringify({
            type: 'iteration_moderated',
            iteration: i,
            prompt: prompt
          })}\n\n`);
          
          break; // Move on immediately after first moderation
        } else if (resultResponse.status === 'Error') {
          throw new Error(`Request failed: ${resultResponse.error}`);
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error(`Iteration ${i} timed out`);
      }
      
    } catch (error) {
      console.error(`Error in iteration ${i}:`, error);
      
      const errorResult = {
        iteration: i,
        status: 'error',
        message: error.message
      };
      
      results.push(errorResult);
      
      // Send error update
      res.write(`data: ${JSON.stringify({
        type: 'iteration_error',
        iteration: i,
        message: error.message
      })}\n\n`);
    }
  }
  
  return results;
}

// Route to handle image upload and processing
app.post('/process', upload.single('image'), async (req, res) => {
  console.log('Received image processing request');
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  try {
    if (!req.file) {
      throw new Error('No image file provided');
    }
    
    console.log('Starting processing with', req.file.buffer.length, 'bytes');
    
    // Process iterations
    const results = await processIterations(req.file.buffer, res);
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      results: results
    })}\n\n`);
    
  } catch (error) {
    console.error('Processing error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
  }
  
  res.end();
});

// Start server
app.listen(port, () => {
  console.log(`Kontext Explorer server running on http://localhost:${port}`);
  console.log('Using Mistral API for image analysis and high-quality prompt generation');
  console.log('Enhanced with BFL prompting guide best practices for superior results');
});