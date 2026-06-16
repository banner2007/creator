import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Zod Validation Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);
    
    // Register user in Supabase Auth
    // Note: This trigger table sync logic in PostgreSQL (handle_new_user)
    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        data: {
          name: validated.name || validated.email.split('@')[0]
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(400).json({ error: 'Registration failed. Check if email is already registered.' });
    }

    return res.status(201).json({
      message: 'Registration successful. Please check your email for verification if enabled.',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user & return session tokens
 */
router.post('/login', async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Fetch custom profile data (role, credits, plan)
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || 'user',
        credits: profile?.credits ?? 20,
        plan: profile?.plan || 'free'
      }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh session token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const { data, error } = await supabase.auth.setSession({
      refresh_token
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Fetch custom profile data
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      },
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name,
        role: profile?.role || 'user',
        credits: profile?.credits ?? 20,
        plan: profile?.plan || 'free'
      }
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ error: 'Internal server error refreshing session.' });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile details
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    return res.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        credits: profile.credits,
        plan: profile.plan,
        created_at: profile.created_at
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
});

export default router;
