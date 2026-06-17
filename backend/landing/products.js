import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Zod Validation Schema for Products
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().default(0),
  category: z.string().optional(),
  cover_image: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft')
});

const updateProductSchema = productSchema.partial();

/**
 * @route   GET /api/products
 * @desc    Get all products for the authenticated user
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Fetch products error:', err);
    return res.status(500).json({ error: 'Internal server error fetching products.' });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const validated = productSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name: validated.name,
        description: validated.description,
        price: validated.price,
        category: validated.category,
        cover_image: validated.cover_image,
        status: validated.status
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Internal server error creating product.' });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update an existing product
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validated = updateProductSchema.parse(req.body);
    const userId = req.user.id;

    // Verify product belongs to user
    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Internal server error updating product.' });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership first
    const { data: existing, error: findError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Product not found or access denied.' });
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ error: 'Internal server error deleting product.' });
  }
});

export default router;
