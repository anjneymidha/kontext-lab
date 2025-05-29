const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 8080;

// Middleware with increased size limits
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file uploads with 50MB limit
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB in bytes
  }
});

// API Keys - use environment variables in production
const MISTRAL_API_KEY = (process.env.MISTRAL_API_KEY || 'CA19NkYkjNgzptn4MB6VE553NA7s06Nh').trim().replace(/[^\w-]/g, '');
const BFL_API_KEY = (process.env.BFL_API_KEY || '6249d98f-d557-4499-98b9-4355cc3f4a42').trim().replace(/[^\w-]/g, '');

// Collection storage - use Postgres for production, file system for local
const collectionsDir = path.join(__dirname, 'collections');

// Postgres connection for production
console.log('🔗 Setting up Postgres connection...');
console.log(`POSTGRES_URL available: ${!!process.env.POSTGRES_URL}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const pool = process.env.POSTGRES_URL ? new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
}) : null;

console.log(`Pool created: ${!!pool}`);

// Initialize collections table if using Postgres
async function initDatabase() {
  console.log('🔧 Initializing database...');
  console.log(`Pool available: ${!!pool}`);
  
  if (pool) {
    try {
      console.log('📝 Creating collections table if not exists...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS collections (
          id VARCHAR(255) PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data JSONB NOT NULL
        )
      `);
      console.log('✅ Collections table ready');
      
      // Test the connection
      const testResult = await pool.query('SELECT NOW()');
      console.log('✅ Database connection test successful:', testResult.rows[0]);
      return true;
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      return false;
    }
  } else {
    console.log('❌ No pool available for database initialization');
    return false;
  }
}

// Database initialization flag
let dbInitialized = false;

// Only create directory for local development
if (!process.env.VERCEL && !fs.existsSync(collectionsDir)) {
  fs.mkdirSync(collectionsDir, { recursive: true });
}

// Cherry Mode transformation prompts - beloved character styles and iconic looks
const cherryModePrompts = [
  'Transform the person into a Muppet character while preserving their exact facial features and expression. Add fuzzy felt texture, bright Muppet colors, and characteristic googly eyes.',
  'Change the person to Minecraft Steve/Alex style while keeping their exact pose and expression. Add blocky pixelated textures, square features, and the iconic Minecraft aesthetic.',
  'Transform the person into a Studio Ghibli character while maintaining their identical facial structure and expression. Apply soft watercolor textures, detailed backgrounds, and Miyazaki\'s signature animation style.',
  'Convert the person into a Rugrats character style while keeping their exact face and pose. Add the show\'s characteristic thick line art, pastel colors, and exaggerated baby-like features.'
];

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

async function getDiversePrompts(imageBuffer) {
  
  // Use true randomization with Fisher-Yates shuffle for Cherry Mode prompts
  const shuffledCherry = fisherYatesShuffle(cherryModePrompts);
  
  // Take 4 Cherry Mode prompts
  const cherryPrompts = shuffledCherry.slice(0, 4);
  
  // Generate 4 Rick Mode prompts using Mistral AI
  const rickPrompts = await generateDynamicPrompts(imageBuffer);
  
  // Combine them: first 4 are Cherry Mode, next 4 are Rick Mode
  const allPrompts = [...cherryPrompts, ...rickPrompts.slice(0, 4)];
  
  return allPrompts;
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

// Function to generate 8 dynamic transformation prompts based on image content
async function generateDynamicPrompts(imageBuffer) {
  console.log('Generating dynamic prompts with Mistral...');
  
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const requestData = {
      model: "pixtral-large-2411",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and generate exactly 4 creative, wild, and unexpected image transformation prompts. Each prompt should:

1. Be completely unique and creative - think of things humans would never expect to ask
2. Preserve the subject's exact pose, facial features, and body position 
3. Be absurd, funny, or surprising in some way
4. Be detailed enough for an AI image generator
5. Start with an action verb like "Transform", "Change", "Convert", etc.

Look at what's in the image and create 4 wildly creative transformation ideas that play with the subject, setting, style, or concept in unexpected ways. Be imaginative!

Respond with exactly 4 prompts, each on a new line, numbered 1-4.`
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

    const content = response.data.choices[0].message.content.trim();
    console.log('Mistral dynamic prompts response:', content);
    
    // Parse the numbered list into an array
    const prompts = content
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(prompt => prompt.length > 0);
    
    if (prompts.length >= 4) {
      return prompts.slice(0, 4);
    } else {
      console.warn(`Only got ${prompts.length} prompts from Mistral, padding with fallbacks`);
      // Pad with some fallback prompts if we didn't get enough
      const fallbacks = [
        'Transform the subject into a living piece of modern art that questions its own existence.',
        'Change the subject to appear made of the last thing they ate, complete with realistic food textures.',
        'Convert the subject into a sentient household object that has gained consciousness.',
        'Transform the subject into their own shadow that has come to life.',
        'Change the subject to look like they\'re made of their favorite childhood toy material.',
        'Convert the subject into a weather phenomenon that follows them everywhere.',
        'Transform the subject into a living emoji that expresses their deepest thoughts.',
        'Change the subject to appear as a conscious piece of technology from the future.'
      ];
      
      return [...prompts, ...fallbacks.slice(0, 8 - prompts.length)];
    }
    
  } catch (error) {
    console.error('Error generating dynamic prompts:', error.response?.data || error.message);
    // Return fallback prompts if API fails
    return [
      'Transform the subject into a living piece of abstract art that questions reality.',
      'Change the subject to appear made of their favorite food, maintaining their exact pose.',
      'Convert the subject into a sentient household appliance with consciousness.',
      'Transform the subject into a walking, talking version of their own reflection.',
      'Change the subject to look like they\'re made of pure energy and light.',
      'Convert the subject into a living cartoon character from an alternate universe.',
      'Transform the subject into a conscious cloud formation with their personality.',
      'Change the subject to appear as a time traveler from the distant future.'
    ];
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
    
    // If BFL API returns 500, check if there's useful data in the response
    if (error.response && error.response.status === 500 && error.response.data) {
      const bflData = error.response.data;
      console.log('BFL 500 response data:', bflData);
      
      // If BFL provides status info even in error response, use it
      if (bflData.status) {
        return bflData;
      }
    }
    
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
  
  // Send dynamic generation event
  res.write(`data: ${JSON.stringify({
    type: 'generating_dynamic_prompts'
  })}\n\n`);
  
  // Generate diverse prompts for this session (8 dynamic + 8 static wild)
  const diversePrompts = await getDiversePrompts(imageBuffer);
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
          console.log(`Iteration ${i} failed with BFL Error status, skipping to next`);
          
          const result = {
            iteration: i,
            prompt: prompt,
            status: 'error',
            message: 'BFL processing failed for this transformation'
          };
          
          results.push(result);
          
          // Send error result but continue processing
          res.write(`data: ${JSON.stringify({
            type: 'iteration_error',
            iteration: i,
            message: 'BFL processing failed, trying next transformation',
            prompt: prompt
          })}\n\n`);
          
          break; // Move to next iteration
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

// Collection management functions
async function saveCollection(originalImageBuffer, results, sessionId, caption = null, konceptNames = null) {
  const collectionId = sessionId || crypto.randomBytes(8).toString('hex');
  
  // Convert image buffer to base64
  const originalImageBase64 = originalImageBuffer.toString('base64');
  
  // Process results to include image data
  const processedResults = await Promise.all(results.map(async (result, index) => {
    let imageBase64 = null;
    
    if (result.status === 'completed' && result.imageUrl) {
      try {
        // Download the image from BFL
        const imageResponse = await axios.get(result.imageUrl, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        imageBase64 = Buffer.from(imageResponse.data).toString('base64');
      } catch (error) {
        console.error(`Failed to download image for result ${index + 1}:`, error.message);
      }
    }
    
    return {
      iteration: result.iteration,
      prompt: result.prompt,
      image: imageBase64,
      isModerated: result.status === 'moderated',
      hasError: result.status === 'error'
    };
  }));
  
  const collection = {
    id: collectionId,
    createdAt: new Date().toISOString(),
    originalImage: originalImageBase64,
    results: processedResults,
    caption: caption,
    konceptNames: konceptNames
  };
  
  // Save to Postgres or file depending on environment
  console.log(`Attempting to save collection: ${collectionId}`);
  console.log(`Environment VERCEL: ${process.env.VERCEL}`);
  console.log(`Pool available: ${!!pool}`);
  
  if (process.env.VERCEL && pool) {
    // Ensure database is initialized
    if (!dbInitialized) {
      console.log('🔄 Database not initialized, initializing now...');
      dbInitialized = await initDatabase();
      if (!dbInitialized) {
        console.error('❌ Failed to initialize database, falling back to memory');
        throw new Error('Database not available');
      }
    }
    
    // Use Postgres for production
    try {
      console.log(`Saving to Postgres with ID: ${collectionId}`);
      await pool.query(
        'INSERT INTO collections (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
        [collectionId, JSON.stringify(collection)]
      );
      console.log(`✅ Collection successfully saved to Postgres: ${collectionId}`);
    } catch (error) {
      console.error('❌ Error saving to Postgres:', error);
      throw error;
    }
  } else {
    // Use file system for local development
    console.log(`Saving to file system: ${collectionId}`);
    const filePath = path.join(collectionsDir, `${collectionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
    console.log(`✅ Collection saved to file: ${collectionId}`);
  }
  
  return collectionId;
}

async function getCollection(collectionId) {
  console.log(`Attempting to get collection: ${collectionId}`);
  console.log(`Environment VERCEL: ${process.env.VERCEL}`);
  console.log(`Pool available: ${!!pool}`);
  
  if (process.env.VERCEL && pool) {
    // Ensure database is initialized
    if (!dbInitialized) {
      console.log('🔄 Database not initialized, initializing now...');
      dbInitialized = await initDatabase();
      if (!dbInitialized) {
        console.error('❌ Failed to initialize database');
        throw new Error('Collection not found');
      }
    }
    
    // Check Postgres for production
    try {
      console.log(`Querying Postgres for collection: ${collectionId}`);
      const result = await pool.query('SELECT data FROM collections WHERE id = $1', [collectionId]);
      console.log(`Query result: ${result.rows.length} rows found`);
      
      if (result.rows.length === 0) {
        console.log(`❌ Collection not found in Postgres: ${collectionId}`);
        throw new Error('Collection not found');
      }
      
      console.log(`✅ Collection found in Postgres: ${collectionId}`);
      const rawData = result.rows[0].data;
      console.log(`Raw data type: ${typeof rawData}`);
      
      // JSONB columns return objects directly, not strings
      if (typeof rawData === 'object') {
        console.log(`✅ Returning JSONB object directly`);
        return rawData;
      } else {
        console.log(`Parsing JSON string...`);
        try {
          return JSON.parse(rawData);
        } catch (parseError) {
          console.error(`❌ JSON parse error for collection ${collectionId}:`, parseError);
          console.error(`Raw data preview: ${JSON.stringify(rawData).substring(0, 200)}...`);
          throw new Error('Collection data corrupted');
        }
      }
    } catch (error) {
      if (error.message === 'Collection not found') {
        throw error;
      }
      console.error('❌ Error reading from Postgres:', error);
      throw new Error('Collection not found');
    }
  } else {
    // Check file system for local development
    console.log(`Checking file system for collection: ${collectionId}`);
    const filePath = path.join(collectionsDir, `${collectionId}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Collection file not found: ${filePath}`);
      throw new Error('Collection not found');
    }
    
    console.log(`✅ Collection found in file: ${filePath}`);
    const collection = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return collection;
  }
}

// Function to generate Open Graph meta tags for session sharing
function generateOpenGraphTags(sessionData, sessionId, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const sessionUrl = `${baseUrl}/session/${sessionId}`;
  
  // Default values
  let title = 'AutoVibe - AI Writes All Your Prompts | BFL Kontext';
  let description = 'Upload image → AI creates wild prompts → See magic happen. A BFL Kontext experiment. No prompting skills needed!';
  let imageUrl = `${baseUrl}/og-image.svg`; // Default image
  
  if (sessionData) {
    // Extract koncept names for title
    const konceptNames = sessionData.konceptNames || [];
    const konceptText = konceptNames.length > 0 
      ? konceptNames.slice(0, 2).join(' + ') 
      : 'AI transformations';
    
    // Custom title with koncept names
    title = `${konceptText} | AutoVibe - BFL Kontext`;
    
    // Custom description with session details
    const resultCount = sessionData.results ? sessionData.results.filter(r => !r.hasError && !r.isModerated).length : 0;
    description = sessionData.caption 
      ? `"${sessionData.caption.substring(0, 120)}..." - See ${resultCount} wild AI transformations`
      : `Check out ${resultCount} wild AI transformations with ${konceptText}`;
    
    // Use first successful result image if available
    const firstImage = sessionData.results?.find(r => r.image && !r.hasError && !r.isModerated);
    if (firstImage && firstImage.image) {
      // Use image serving endpoint instead of data URL
      imageUrl = `${baseUrl}/api/session/${sessionId}/preview-image`;
    }
  }
  
  // Escape HTML entities for safe injection
  const escapeHtml = (str) => str.replace(/[&<>"']/g, (match) => {
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return escapeMap[match];
  });
  
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  
  // Generate meta tags
  return `<title>${safeTitle}</title>
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:url" content="${sessionUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="AutoVibe">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${imageUrl}">
    <meta name="description" content="${safeDescription}">`;
}

// Collection sharing routes
// Session URL route - serve app with dynamic Open Graph meta tags
app.get('/session/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // Try to get session data for Open Graph tags
    let sessionData = null;
    try {
      sessionData = await getCollection(sessionId);
    } catch (error) {
      console.log(`Session ${sessionId} not found in database, using default OG tags`);
    }
    
    // Generate dynamic Open Graph meta tags
    const ogTags = generateOpenGraphTags(sessionData, sessionId, req);
    
    // Inject Open Graph tags into HTML head
    html = html.replace('<title>AutoVibe - AI Writes All Your Prompts | BFL Kontext</title>', ogTags);
    
    res.send(html);
    
  } catch (error) {
    console.error('Error serving session page:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/collection/:id', async (req, res) => {
  try {
    const collection = await getCollection(req.params.id);
    
    // Serve the main app but with collection data embedded
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    
    // The frontend will detect the collection URL and load it via API
    res.send(html);
    
  } catch (error) {
    console.error('Error loading collection:', error);
    res.status(404).json({ error: 'Collection not found' });
  }
});

app.get('/api/session/:id', async (req, res) => {
  try {
    const collection = await getCollection(req.params.id);
    res.json(collection);
  } catch (error) {
    console.error('Error loading session:', error);
    res.status(404).json({ error: 'Session not found' });
  }
});

app.get('/api/collection/:id', async (req, res) => {
  try {
    const collection = await getCollection(req.params.id);
    res.json(collection);
  } catch (error) {
    console.error('Error loading collection:', error);
    res.status(404).json({ error: 'Collection not found' });
  }
});

// Serve preview image for Open Graph
app.get('/api/session/:id/preview-image', async (req, res) => {
  try {
    const sessionData = await getCollection(req.params.id);
    
    // Find first successful result image
    const firstImage = sessionData.results?.find(r => r.image && !r.hasError && !r.isModerated);
    
    if (firstImage && firstImage.image) {
      // Convert base64 to buffer and serve as JPEG
      const imageBuffer = Buffer.from(firstImage.image, 'base64');
      
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      });
      
      res.send(imageBuffer);
    } else {
      // Return default image if no results
      const defaultImagePath = path.join(__dirname, 'public', 'og-image.svg');
      if (fs.existsSync(defaultImagePath)) {
        res.sendFile(defaultImagePath);
      } else {
        res.status(404).json({ error: 'No preview image available' });
      }
    }
    
  } catch (error) {
    console.error('Error serving preview image:', error);
    res.status(404).json({ error: 'Preview image not found' });
  }
});

// Test endpoint for edit API
app.get('/api/edit-test', (req, res) => {
  res.json({ status: 'Edit API is working', timestamp: new Date().toISOString() });
});

// API endpoint for vibe analysis
app.post('/api/analyze-vibes', async (req, res) => {
  console.log('📸 Vibe analysis endpoint hit');
  
  try {
    const { image } = req.body;
    console.log('📋 Request body received:', { hasImage: !!image, imageLength: image?.length });
    
    if (!image) {
      console.error('❌ Missing image data');
      return res.status(400).json({ error: 'Image data is required' });
    }
    
    console.log('🎨 Starting vibe analysis with Mistral...');
    
    const requestData = {
      model: "pixtral-large-2411",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide two things:\n\n1. DESCRIPTION: Give a detailed description of what you see in the image - the person, their appearance, pose, setting, clothing, expression, etc. Be specific and observational.\n\n2. VIBES: Extract 3 ULTRA-SPECIFIC, viral-worthy transformation directions that would make people say \"How did they even think of this?!\" Focus on:\n\nIMPOSSIBLE AESTHETIC MASHUPS:\n- \"[obscure culture]-[internet meme]\" → \"amish-vaporwave\", \"viking-kawaii\", \"medieval-cyberpunk\"\n- \"[art movement]-[modern subculture]\" → \"baroque-streetwear\", \"dadaist-goth\", \"impressionist-gamer\"\n- \"[time period]-[opposite era]\" → \"stone-age-futurism\", \"1800s-cyberpunk\", \"ancient-modern\"\n\nABSURD MATERIAL/CONTEXT COMBOS:\n- \"[impossible material]-[unexpected setting]\" → \"crystal-underground\", \"smoke-formal\", \"liquid-metal-cozy\"\n- \"[physics-defying]-[mundane activity]\" → \"floating-domestic\", \"microscopic-epic\", \"giant-delicate\"\n\nVIRAL CONTRADICTION VIBES:\n- Combine 3+ completely opposite concepts\n- Make it feel like an AI fever dream\n- Ensure maximum shareability and \"wtf\" factor\n\nExamples: 'holographic-amish-cyberpunk', 'microscopic-epic-medieval', 'liquid-brutalist-kawaii', 'floating-goth-tropical'\n\nFormat your response as:\nDESCRIPTION: [detailed description here]\nVIBES: impossible-mashup-1, absurd-combination-2, viral-contradiction-3"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`
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

    const fullResponse = response.data.choices[0].message.content.trim();
    console.log('🎯 Mistral analysis response:', fullResponse);
    
    // Parse the structured response
    let description = "Image analyzed successfully";
    let vibes = ['creative', 'unique', 'interesting'];
    
    try {
      // Extract description
      const descMatch = fullResponse.match(/DESCRIPTION:\s*(.+?)(?=\nVIBES:|$)/s);
      if (descMatch) {
        description = descMatch[1].trim();
      }
      
      // Extract vibes
      const vibesMatch = fullResponse.match(/VIBES:\s*(.+)/);
      if (vibesMatch) {
        vibes = vibesMatch[1]
          .split(',')
          .map(word => word.trim().toLowerCase())
          .filter(word => word.length > 0)
          .slice(0, 4); // Limit to 4 words max
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse structured response, using fallback parsing');
      // Fallback: try to extract vibes from anywhere in the response
      const words = fullResponse.toLowerCase().split(/[,\s]+/);
      vibes = words.filter(word => word.length > 3).slice(0, 4);
    }
    
    console.log('✅ Extracted description:', description.substring(0, 100) + '...');
    console.log('✅ Extracted vibes:', vibes);
    
    return res.json({
      success: true,
      description: description,
      vibes: vibes,
      rawResponse: fullResponse
    });
    
  } catch (error) {
    console.error('❌ Vibe analysis error:', error);
    
    // More specific error handling
    let errorMessage = 'Failed to analyze vibes';
    let statusCode = 500;
    
    if (error.response && error.response.status === 500) {
      const mistralError = error.response.data;
      if (mistralError && mistralError.message) {
        if (mistralError.message.includes('could not be loaded as a valid image')) {
          errorMessage = 'Invalid image format - please try a different image';
          statusCode = 400;
        } else {
          errorMessage = `Mistral API error: ${mistralError.message}`;
        }
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to Mistral API';
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      mistralError: error.response?.data 
    });
  }
});

// API endpoint for generating vibe-specific prompts
app.post('/api/generate-vibe-prompts', async (req, res) => {
  console.log('🎯 Vibe-specific prompt generation endpoint hit');
  
  try {
    const { image, vibe } = req.body;
    console.log('📋 Request body received:', { hasImage: !!image, vibe, imageLength: image?.length });
    
    if (!image || !vibe) {
      console.error('❌ Missing required data');
      return res.status(400).json({ error: 'Image data and vibe are required' });
    }
    
    console.log(`🔮 Generating prompts to maximize "${vibe}" vibe...`);
    
    const requestData = {
      model: "pixtral-large-2411",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and create 4 WILD, VIRAL transformation prompts for "${vibe}" that will make people stop scrolling and share immediately.

ULTRA-CREATIVE PROMPT FORMULAS:

1. IMPOSSIBLE COMBINATIONS:
   - "Transform into [absurd material] sculpture but [impossible context]"
   - Examples: "Made of flowing lava but sitting in an ice cream parlor", "Constructed from pure light but underground in caves"

2. VIRAL MEME POTENTIAL:
   - Pop culture mashups: "As a character in [unexpected movie/game/show] but [plot twist]"
   - Internet culture: "As the main character in a TikTok trend but [absurd scenario]"

3. SCALE & PHYSICS BREAKS:
   - "Tiny microscopic version living inside [unexpected place]"
   - "Giant kaiju-sized version but [wholesome activity]"
   - "Floating weightless but [grounded activity]"

4. AESTHETIC CHAOS:
   - "${vibe} meets [completely opposite vibe] in [impossible location]"
   - Mix 3+ completely different art styles/eras/cultures

SPECIFIC TO "${vibe}" - Push these boundaries:
- Make it 10x more extreme than expected
- Add impossible physics or materials
- Include viral/meme potential
- Create "How is this even possible?" moments
- Ensure it's screenshot-worthy and shareable

MUST maintain perfect character likeness while being absolutely WILD.

Respond with exactly 4 prompts, numbered 1-4. Make them so creative they feel like they came from an AI fever dream.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`
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

    const promptText = response.data.choices[0].message.content.trim();
    console.log(`🎯 Mistral ${vibe} prompts response:`, promptText);
    
    // Extract numbered prompts from the response
    const prompts = promptText
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(prompt => prompt.length > 0)
      .slice(0, 4); // Limit to 4 prompts
    
    if (prompts.length < 4) {
      console.warn(`Only got ${prompts.length} prompts from Mistral, padding with variations`);
      // Add fallback prompts if needed
      const fallbackPrompts = [
        `Transform the subject to have a more ${vibe} appearance with enhanced styling and visual elements.`,
        `Change the environment around the subject to create a ${vibe} atmosphere with appropriate lighting and background.`,
        `Add ${vibe} accessories and clothing while maintaining the subject's core features and expression.`,
        `Enhance the overall composition to maximize the ${vibe} feeling through colors, textures, and styling.`
      ];
      
      while (prompts.length < 4) {
        prompts.push(fallbackPrompts[prompts.length]);
      }
    }
    
    console.log(`✅ Generated ${prompts.length} ${vibe} prompts:`, prompts);
    
    return res.json({
      success: true,
      prompts: prompts,
      vibe: vibe,
      rawResponse: promptText
    });
    
  } catch (error) {
    console.error(`❌ ${vibe} prompt generation error:`, error);
    
    // More specific error handling
    let errorMessage = 'Failed to generate vibe-specific prompts';
    let statusCode = 500;
    
    if (error.response && error.response.status === 500) {
      const mistralError = error.response.data;
      if (mistralError && mistralError.message) {
        if (mistralError.message.includes('could not be loaded as a valid image')) {
          errorMessage = 'Invalid image format for prompt generation';
          statusCode = 400;
        } else {
          errorMessage = `Mistral API error: ${mistralError.message}`;
        }
      }
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.message,
      mistralError: error.response?.data 
    });
  }
});

// API endpoint for saving AutoVibe sessions
app.post('/api/save-session', async (req, res) => {
  console.log('💾 Save session endpoint hit');
  
  try {
    const { originalImage, results, sessionId, caption, konceptNames } = req.body;
    console.log('📋 Session data received:', { 
      hasOriginalImage: !!originalImage, 
      resultsCount: results?.length,
      sessionId 
    });
    
    if (!originalImage || !results || !Array.isArray(results)) {
      console.error('❌ Missing required session data');
      return res.status(400).json({ error: 'Original image and results are required' });
    }
    
    // Convert base64 to buffer for consistency with existing saveCollection function
    const originalImageBuffer = Buffer.from(originalImage, 'base64');
    
    // Transform results to match expected format
    const transformedResults = results.map((result, index) => ({
      iteration: index + 1,
      prompt: result.prompt || `Koncept transformation ${index + 1}`,
      imageUrl: result.imageUrl || null,
      status: result.status || 'completed'
    }));
    
    console.log('🔄 Saving session with transformed results...');
    const collectionId = await saveCollection(originalImageBuffer, transformedResults, sessionId, caption, konceptNames);
    const shareUrl = `${req.protocol}://${req.get('host')}/session/${collectionId}`;
    
    console.log('✅ Session saved successfully:', collectionId);
    
    return res.json({
      success: true,
      sessionId: collectionId,
      shareUrl: shareUrl
    });
    
  } catch (error) {
    console.error('❌ Save session error:', error);
    res.status(500).json({ 
      error: 'Failed to save session',
      details: error.message 
    });
  }
});

// API endpoint for iterative image editing
app.post('/api/edit-image', async (req, res) => {
  console.log('📥 Edit API endpoint hit');
  
  try {
    const { prompt, source_image_url, input_image, steps = 50, guidance = 3.0 } = req.body;
    console.log('📋 Request body received:', { 
      hasPrompt: !!prompt, 
      hasImageUrl: !!source_image_url,
      hasImage: !!input_image, 
      promptLength: prompt?.length,
      imageUrl: source_image_url
    });
    
    if (!prompt || (!source_image_url && !input_image)) {
      console.error('❌ Missing required fields:', { hasPrompt: !!prompt, hasImageUrl: !!source_image_url, hasImage: !!input_image });
      return res.status(400).json({ error: 'Prompt and either source_image_url or input_image are required' });
    }
    
    let base64Image;
    if (source_image_url) {
      // Fetch image server-side to avoid CORS issues
      console.log('🌐 Fetching image from URL server-side:', source_image_url);
      try {
        const imageResponse = await fetch(source_image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString('base64');
        console.log('✅ Successfully converted image URL to base64');
      } catch (fetchError) {
        console.error('❌ Error fetching image from URL:', fetchError);
        return res.status(400).json({ error: 'Failed to fetch image from URL', details: fetchError.message });
      }
    } else {
      base64Image = input_image;
    }
    
    console.log(`🎨 Starting iterative edit with prompt: "${prompt.substring(0, 100)}..."`);
    
    // Clean the API key and call BFL API
    const cleanApiKey = BFL_API_KEY;
    console.log('🔑 API key available:', !!cleanApiKey);
    
    const requestBody = {
      prompt: prompt,
      input_image: base64Image,
      steps: parseInt(steps),
      guidance: parseFloat(guidance)
    };
    
    console.log('🔥 Calling BFL API for edit...');
    const bflResponse = await fetch('https://api.us1.bfl.ai/v1/flux-kontext-pro', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': cleanApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!bflResponse.ok) {
      const errorData = await bflResponse.text();
      console.error('BFL API Error:', errorData);
      throw new Error(`BFL API error: ${bflResponse.status} - ${errorData}`);
    }
    
    const bflResult = await bflResponse.json();
    console.log('📬 Got BFL response:', bflResult);
    
    const requestId = bflResult.id;
    if (!requestId) {
      throw new Error('No request ID received from BFL API');
    }
    
    // Poll for results
    console.log('⏰ Polling for edit results...');
    let attempts = 0;
    const maxAttempts = 30; // 45 seconds timeout (30 attempts × 1.5s)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      attempts++;
      
      const resultResponse = await fetch(`https://api.us1.bfl.ai/v1/get_result?id=${requestId}`, {
        headers: {
          'accept': 'application/json',
          'x-key': cleanApiKey
        }
      });
      
      if (!resultResponse.ok) {
        console.error('Result fetch error:', resultResponse.status);
        continue;
      }
      
      const result = await resultResponse.json();
      console.log(`📊 Polling attempt ${attempts}, status: ${result.status}`);
      
      if (result.status === 'Ready') {
        const imageData = result.result.sample;
        console.log('✅ Edit completed successfully');
        
        // Check if imageData is a URL or base64 data
        let editedImageUrl;
        if (imageData.startsWith('http')) {
          // It's a URL, use it directly
          editedImageUrl = imageData;
        } else {
          // It's base64 data, create a data URL
          editedImageUrl = `data:image/jpeg;base64,${imageData}`;
        }
        
        console.log('🖼️ Edit image URL type:', imageData.startsWith('http') ? 'URL' : 'base64');
        
        return res.json({
          success: true,
          imageUrl: editedImageUrl,
          prompt: prompt,
          moderated: false
        });
      } else if (result.status === 'Content Moderated') {
        console.log('⚠️ Edit result was moderated');
        return res.json({
          success: false,
          moderated: true,
          prompt: prompt
        });
      } else if (result.status === 'Request Moderated') {
        console.log('⚠️ Edit request was moderated');
        return res.json({
          success: false,
          moderated: true,
          prompt: prompt
        });
      }
    }
    
    throw new Error('Edit timeout - request took too long');
    
  } catch (error) {
    console.error('❌ Iterative edit error:', error);
    res.status(500).json({ 
      error: 'Failed to process iterative edit',
      details: error.message 
    });
  }
});

// New async endpoint - start generation and return request ID
app.post('/api/start-generation', async (req, res) => {
  console.log('🚀 Start generation endpoint hit');
  
  try {
    const { prompt, source_image_url, input_image, steps = 50, guidance = 3.0 } = req.body;
    
    if (!prompt || (!source_image_url && !input_image)) {
      return res.status(400).json({ error: 'Prompt and either source_image_url or input_image are required' });
    }
    
    let base64Image;
    if (source_image_url) {
      console.log('🌐 Fetching image from URL server-side:', source_image_url);
      try {
        const imageResponse = await fetch(source_image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();
        base64Image = Buffer.from(imageBuffer).toString('base64');
      } catch (fetchError) {
        console.error('❌ Error fetching image from URL:', fetchError);
        return res.status(400).json({ error: 'Failed to fetch image from URL', details: fetchError.message });
      }
    } else {
      base64Image = input_image;
    }
    
    console.log(`🎨 Starting generation with prompt: "${prompt.substring(0, 100)}..."`);
    
    const requestBody = {
      prompt: prompt,
      input_image: base64Image,
      steps: parseInt(steps),
      guidance: parseFloat(guidance)
    };
    
    console.log('🔥 Calling BFL API to start generation...');
    const bflResponse = await fetch('https://api.us1.bfl.ai/v1/flux-kontext-pro', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!bflResponse.ok) {
      const errorData = await bflResponse.text();
      console.error('BFL API Error:', errorData);
      throw new Error(`BFL API error: ${bflResponse.status} - ${errorData}`);
    }
    
    const bflResult = await bflResponse.json();
    console.log('📬 Got BFL response:', bflResult);
    
    const requestId = bflResult.id;
    if (!requestId) {
      throw new Error('No request ID received from BFL API');
    }
    
    console.log('✅ Generation started, returning request ID:', requestId);
    res.json({ success: true, requestId: requestId });
    
  } catch (error) {
    console.error('❌ Start generation error:', error);
    res.status(500).json({ 
      error: 'Failed to start generation',
      details: error.message 
    });
  }
});

// Check generation status endpoint
app.get('/api/check-generation/:requestId', async (req, res) => {
  console.log('🔍 Check generation status endpoint hit');
  
  try {
    const { requestId } = req.params;
    
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }
    
    console.log('🔍 Checking status for request:', requestId);
    
    const resultResponse = await fetch(`https://api.us1.bfl.ai/v1/get_result?id=${requestId}`, {
      headers: {
        'accept': 'application/json',
        'x-key': BFL_API_KEY
      }
    });
    
    if (!resultResponse.ok) {
      const errorData = await resultResponse.text();
      console.error('❌ BFL result API error:', errorData);
      return res.status(500).json({ 
        error: 'Failed to check generation status',
        details: errorData 
      });
    }
    
    const resultData = await resultResponse.json();
    console.log('📊 Generation status:', resultData.status || 'unknown');
    
    if (resultData.status === 'Ready') {
      console.log('✅ Generation completed successfully');
      const imageData = resultData.result?.sample;
      
      if (!imageData) {
        return res.json({ status: 'error', error: 'No image data in result' });
      }
      
      // Check if imageData is a URL or base64 data
      let imageUrl;
      if (imageData.startsWith('http')) {
        // It's a URL, use it directly
        imageUrl = imageData;
      } else {
        // It's base64 data, create a data URL
        imageUrl = `data:image/jpeg;base64,${imageData}`;
      }
      
      console.log('🖼️ Image URL type:', imageData.startsWith('http') ? 'URL' : 'base64');
      
      res.json({ 
        status: 'completed',
        success: true,
        imageUrl: imageUrl 
      });
    } else if (resultData.status === 'Error') {
      console.log('❌ Generation failed with error');
      res.json({ 
        status: 'error',
        error: resultData.error || 'Unknown error'
      });
    } else {
      // Still processing
      console.log('⏳ Generation still in progress');
      res.json({ 
        status: 'processing',
        message: 'Generation in progress...'
      });
    }
    
  } catch (error) {
    console.error('❌ Check generation error:', error);
    res.status(500).json({ 
      error: 'Failed to check generation status',
      details: error.message 
    });
  }
});

// Individual image sharing endpoint
app.get('/image/:sessionId/:konceptIndex/:resultIndex', async (req, res) => {
  console.log('🔗 Individual image share request');
  
  try {
    const { sessionId, konceptIndex, resultIndex } = req.params;
    
    if (!sessionId || konceptIndex === undefined || resultIndex === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log(`🔍 Looking for image: session=${sessionId}, koncept=${konceptIndex}, result=${resultIndex}`);
    
    // Get session data
    let sessionData = null;
    
    if (pool) {
      // Try database first
      try {
        const result = await pool.query('SELECT data FROM sessions WHERE id = $1', [sessionId]);
        if (result.rows.length > 0) {
          sessionData = result.rows[0].data;
          console.log('📊 Session found in database');
        }
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
      }
    }
    
    // Try file system if database fails or no pool
    if (!sessionData) {
      try {
        const sessionFile = path.join(collectionsDir, `${sessionId}.json`);
        if (fs.existsSync(sessionFile)) {
          const fileContent = fs.readFileSync(sessionFile, 'utf8');
          sessionData = JSON.parse(fileContent);
          console.log('📂 Session found in file system');
        }
      } catch (fileError) {
        console.error('❌ File system error:', fileError);
      }
    }
    
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Find the specific image
    const konceptIdx = parseInt(konceptIndex);
    const resultIdx = parseInt(resultIndex);
    
    if (!sessionData.results || !sessionData.results[konceptIdx] || !sessionData.results[konceptIdx][resultIdx]) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const imageData = sessionData.results[konceptIdx][resultIdx];
    
    // Create a single image view HTML page
    const imageHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AutoVibe - AI Generated Image | BFL Kontext</title>
    <meta property="og:title" content="AutoVibe - AI Generated Image | BFL Kontext">
    <meta property="og:description" content="Check out this AI-generated image transformation from AutoVibe - a BFL Kontext experiment">
    <meta property="og:image" content="${imageData.imageUrl || imageData.image}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            text-align: center;
        }
        .image-container {
            background: #111;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #333;
        }
        .generated-image {
            max-width: 100%;
            max-height: 70vh;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
        }
        .prompt {
            background: #222;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ff6600;
        }
        .actions {
            margin: 20px 0;
        }
        .btn {
            background: #ff6600;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 0 10px;
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            background: #e55a00;
        }
        .share-url {
            background: #333;
            padding: 10px;
            border-radius: 6px;
            word-break: break-all;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 AutoVibe</h1>
        <p>AI-Generated Image Transformation</p>
        <p style="font-size: 12px; color: #888; margin-top: 10px;">A <a href="https://bfl.ai/" style="color: #ff6600;">BFL Kontext</a> experiment</p>
        
        <div class="image-container">
            <img src="${imageData.imageUrl || imageData.image}" alt="Generated Image" class="generated-image">
        </div>
        
        ${imageData.prompt ? `
        <div class="prompt">
            <strong>Prompt:</strong><br>
            ${imageData.prompt}
        </div>
        ` : ''}
        
        <div class="actions">
            <a href="/session/${sessionId}" class="btn">View Full Session</a>
            <a href="/" class="btn">Create New</a>
            <button onclick="copyShareLink()" class="btn">Copy Share Link</button>
        </div>
        
        <div class="share-url" id="shareUrl">${req.protocol}://${req.get('host')}/image/${sessionId}/${konceptIndex}/${resultIndex}</div>
    </div>
    
    <script>
        function copyShareLink() {
            const shareUrl = document.getElementById('shareUrl').textContent;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Share link copied to clipboard!');
            });
        }
    </script>
</body>
</html>`;
    
    res.send(imageHtml);
    
  } catch (error) {
    console.error('❌ Individual image share error:', error);
    res.status(500).json({ 
      error: 'Failed to load shared image',
      details: error.message 
    });
  }
});

// Error handling middleware for multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        error: 'File too large. Maximum size is 50MB.' 
      });
    }
  }
  next(error);
});

// Route to handle vibe-specific transformations
app.post('/process-vibe', upload.single('image'), async (req, res) => {
  console.log('🎯 Received vibe transformation request');
  
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
    
    const vibePrompts = JSON.parse(req.body.vibePrompts || '[]');
    const selectedVibe = req.body.selectedVibe;
    
    if (!vibePrompts.length || !selectedVibe) {
      throw new Error('Missing vibe prompts or selected vibe');
    }
    
    console.log(`🎨 Starting ${selectedVibe} vibe processing with ${vibePrompts.length} prompts`);
    
    // Process vibe-specific iterations
    const results = await processVibeIterations(req.file.buffer, vibePrompts, selectedVibe, res);
    
    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'vibe_complete',
      vibe: selectedVibe,
      results: results
    })}\n\n`);
    
  } catch (error) {
    console.error('Vibe processing error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'vibe_error',
      message: error.message
    })}\n\n`);
  }
  
  res.end();
});

// Function to process vibe-specific iterations
async function processVibeIterations(imageBuffer, vibePrompts, selectedVibe, res) {
  const results = [];
  
  for (let i = 0; i < vibePrompts.length; i++) {
    try {
      console.log(`Starting ${selectedVibe} iteration ${i + 1}`);
      
      // Send iteration start event
      res.write(`data: ${JSON.stringify({
        type: 'vibe_iteration_start',
        iteration: i + 1,
        vibe: selectedVibe
      })}\n\n`);
      
      const prompt = vibePrompts[i];
      
      // Submit request using original image
      const requestId = await submitKontextRequest(imageBuffer, prompt);
      
      // Poll for result
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const resultResponse = await checkKontextStatus(requestId);
        console.log(`${selectedVibe} iteration ${i + 1} status:`, resultResponse.status);
        
        if (resultResponse.status === 'Ready') {
          console.log(`${selectedVibe} iteration ${i + 1} completed successfully`);
          
          const result = {
            iteration: i + 1,
            prompt: prompt,
            imageUrl: resultResponse.result.sample,
            status: 'completed',
            vibe: selectedVibe
          };
          
          results.push(result);
          
          // Send result update
          res.write(`data: ${JSON.stringify({
            type: 'vibe_iteration_complete',
            iteration: i + 1,
            image: resultResponse.result.sample,
            prompt: prompt,
            vibe: selectedVibe
          })}\n\n`);
          
          break;
        } else if (resultResponse.status === 'Content Moderated' || resultResponse.status === 'Request Moderated') {
          console.log(`${selectedVibe} iteration ${i + 1} moderated`);
          
          const result = {
            iteration: i + 1,
            prompt: prompt,
            status: 'moderated',
            vibe: selectedVibe,
            message: 'Content was moderated'
          };
          
          results.push(result);
          
          // Send moderated result
          res.write(`data: ${JSON.stringify({
            type: 'vibe_iteration_error',
            iteration: i + 1,
            message: 'Content moderated',
            vibe: selectedVibe
          })}\n\n`);
          
          break;
        } else if (resultResponse.status === 'Error') {
          throw new Error(`Request failed: ${resultResponse.error}`);
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error(`${selectedVibe} iteration ${i + 1} timed out`);
      }
      
    } catch (error) {
      console.error(`Error in ${selectedVibe} iteration ${i + 1}:`, error);
      
      const errorResult = {
        iteration: i + 1,
        status: 'error',
        message: error.message,
        vibe: selectedVibe
      };
      
      results.push(errorResult);
      
      // Send error update
      res.write(`data: ${JSON.stringify({
        type: 'vibe_iteration_error',
        iteration: i + 1,
        message: error.message,
        vibe: selectedVibe
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
    
    // Save collection for sharing with session ID
    const sessionId = req.body.sessionId || crypto.randomBytes(8).toString('hex');
    const collectionId = await saveCollection(req.file.buffer, results, sessionId);
    const shareUrl = `${req.protocol}://${req.get('host')}/session/${sessionId}`;
    
    // Send completion with share URL
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      results: results,
      shareUrl: shareUrl
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