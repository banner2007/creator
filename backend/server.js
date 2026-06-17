import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Resolve directory paths (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (.env in backend or root)
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('WARNING: SUPABASE_URL or keys are missing in .env. Some services might not work.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder');

// Global Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Turn off for local previewing and third-party script styling
}));
app.use(cors({
  origin: '*', // Allow all origins for dev/demo, can restrict to specific domains in prod
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Support larger JSON payloads for layout building

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Import Modular Routers
import authRouter from './auth/auth.js';
import aiRouter from './ai/aiImages.js';
import landingRouter from './landing/landingBuilder.js';
import publishRouter from './publish/publish.js';
import analyticsRouter from './analytics/analytics.js';
import productsRouter from './landing/products.js';
import researchRouter from './ai/research.js';

// Register Modular Routers
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/landing', landingRouter);
app.use('/api/publish', publishRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/products', productsRouter);
app.use('/api/ai/research', researchRouter);

// Wildcard route to serve published HTML pages under subdomains or preview path
app.get('/published/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Fetch the published HTML from Supabase Storage exports bucket
    const { data, error } = await supabase
      .storage
      .from('exports')
      .download(`pages/${slug}/index.html`);
      
    if (error || !data) {
      return res.status(404).send('<h1>404 - Landing page not found or not published yet.</h1>');
    }
    
    const htmlText = await data.text();
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 mins
    return res.send(htmlText);
  } catch (err) {
    console.error('Error serving published page:', err);
    return res.status(500).send('<h1>500 - Internal Server Error</h1>');
  }
});

// Root check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Creator Shopy Backend Server running successfully',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[Creator Shopy] Server running on http://localhost:${PORT}`);
});
