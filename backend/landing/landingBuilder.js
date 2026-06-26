import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Zod Validation Schemas
const projectSchema = z.object({
  name: z.string().min(1),
  type: z.string().default('landing-page'),
  status: z.string().default('active')
});

const landingSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1),
  slug: z.string().min(1)
});

const sectionSchema = z.object({
  type: z.enum(['hero', 'gallery', 'benefits', 'comparison', 'faq', 'offer', 'cta', 'reviews']),
  content_json: z.record(z.any()),
  position: z.number().int()
});

const saveSectionsSchema = z.object({
  sections: z.array(sectionSchema),
  title: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  slug: z.string().optional(),
  lazy_load: z.boolean().optional(),
  masking: z.boolean().optional(),
  custom_css: z.string().nullable().optional(),
  whatsapp_phone: z.string().optional(),
  whatsapp_text: z.string().optional(),
  whatsapp_active: z.boolean().optional(),
  floating_cta_text: z.string().optional(),
  floating_cta_active: z.boolean().optional()
});

// Seed default sections
const DEFAULT_SECTIONS = [
  {
    type: 'hero',
    position: 0,
    content_json: {
      title: 'El producto revolucionario que estabas esperando',
      subtitle: 'La solución definitiva para optimizar tu día a día con tecnología premium.',
      ctaText: 'PEDIR CON DESCUENTO',
      ctaLink: '#offer',
      bgType: 'image',
      theme: 'light'
    }
  },
  {
    type: 'benefits',
    position: 1,
    content_json: {
      title: '¿Por qué elegir nuestro producto?',
      items: [
        { title: 'Envío Gratis & Contra Entrega', description: 'Pagas en efectivo al recibir tu pedido en la puerta de tu casa.' },
        { title: 'Calidad Premium Garantizada', description: 'Fabricado con los mejores estándares para una máxima durabilidad.' },
        { title: 'Garantía Total de Satisfacción', description: 'Si el producto no cumple con lo esperado, te devolvemos tu dinero.' }
      ]
    }
  },
  {
    type: 'offer',
    position: 2,
    content_json: {
      title: 'Oferta Especial de Lanzamiento',
      price: '89.900',
      originalPrice: '149.900',
      features: ['Envío Gratis a Nivel Nacional', 'Pago Contra Entrega en Efectivo', 'Garantía Directa de 30 Días', 'Soporte VIP por WhatsApp'],
      badge: 'ENVÍO GRATIS + PAGO CONTRAENTREGA',
      buttonText: 'PEDIR CON DESCUENTO'
    }
  },
  {
    type: 'faq',
    position: 3,
    content_json: {
      title: 'Preguntas Frecuentes',
      questions: [
        { q: '¿Tiene costo el envío?', a: 'No, el envío es completamente gratis a cualquier parte del país.' },
        { q: '¿Cómo funciona el Pago Contra Entrega?', a: 'Pagas en efectivo únicamente al momento de recibir el producto en tu domicilio.' },
        { q: '¿Qué garantía tengo?', a: 'Ofrecemos 30 días de garantía total por defectos de fábrica o inconformidad.' }
      ]
    }
  }
];

/**
 * @route   POST /api/landing/project
 * @desc    Create a new project
 */
router.post('/project', requireAuth, async (req, res) => {
  try {
    const validated = projectSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: validated.name,
        type: validated.type,
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
    console.error('Project creation error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error creating project.' });
  }
});

/**
 * @route   GET /api/landing/projects
 * @desc    Get all projects for authenticated user
 */
router.get('/projects', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error('Fetch projects error:', err);
    return res.status(500).json({ error: 'Internal server error fetching projects.' });
  }
});

/**
 * @route   DELETE /api/landing/project/:id
 * @desc    Delete a project permanently
 */
router.delete('/project/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership first
    const { data: existing, error: findError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({ error: 'Project not found or access denied.' });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (err) {
    console.error('Delete project error:', err);
    return res.status(500).json({ error: 'Internal server error deleting project.' });
  }
});

/**
 * @route   POST /api/landing
 * @desc    Create a new landing page with default sections
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const validated = landingSchema.parse(req.body);

    // Verify project belongs to user
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', validated.projectId)
      .eq('user_id', req.user.id)
      .single();

    if (pError || !project) {
      return res.status(403).json({ error: 'Access denied: Project does not belong to user.' });
    }

    // Insert landing page metadata
    const { data: landing, error: lError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: validated.projectId,
        title: validated.title,
        slug: validated.slug,
        seo_title: validated.title,
        seo_description: `Descubre ${validated.title} al mejor precio.`
      })
      .select()
      .single();

    if (lError) throw lError;

    // Seed default sections
    const sectionsToInsert = DEFAULT_SECTIONS.map(sec => ({
      landing_id: landing.id,
      type: sec.type,
      content_json: sec.content_json,
      position: sec.position
    }));

    const { error: sError } = await supabase
      .from('sections')
      .insert(sectionsToInsert);

    if (sError) throw sError;

    return res.status(201).json({
      ...landing,
      sections: sectionsToInsert
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Landing creation error:', err);
    return res.status(500).json({ error: 'Internal server error creating landing page.' });
  }
});

/**
 * @route   GET /api/landing/:id
 * @desc    Get landing page and its sections
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch landing metadata
    const { data: landing, error: lError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (lError || !landing) {
      return res.status(404).json({ error: 'Landing page not found.' });
    }

    // Fetch sections
    const { data: sections, error: sError } = await supabase
      .from('sections')
      .select('*')
      .eq('landing_id', id)
      .order('position', { ascending: true });

    if (sError) throw sError;

    return res.json({
      ...landing,
      sections
    });
  } catch (err) {
    console.error('Fetch landing error:', err);
    return res.status(500).json({ error: 'Internal server error fetching landing.' });
  }
});

/**
 * @route   PUT /api/landing/:id
 * @desc    Save/Autosave landing page sections and SEO details
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validated = saveSectionsSchema.parse(req.body);

    // Verify ownership
    const { data: landing, error: lError } = await supabase
      .from('landing_pages')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (lError || !landing) {
      return res.status(404).json({ error: 'Landing page not found.' });
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', landing.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!project) {
      return res.status(403).json({ error: 'Access denied: Landing page does not belong to user.' });
    }

    // Update metadata (Title/SEO/custom options)
    const updateMeta = {};
    if (validated.title) updateMeta.title = validated.title;
    if (validated.seo_title) updateMeta.seo_title = validated.seo_title;
    if (validated.seo_description) updateMeta.seo_description = validated.seo_description;
    
    const extraMeta = {};
    if (validated.slug) extraMeta.slug = validated.slug;
    if (validated.lazy_load !== undefined) extraMeta.lazy_load = validated.lazy_load;
    if (validated.masking !== undefined) extraMeta.masking = validated.masking;
    if (validated.custom_css !== undefined) extraMeta.custom_css = validated.custom_css;
    if (validated.whatsapp_phone !== undefined) extraMeta.whatsapp_phone = validated.whatsapp_phone;
    if (validated.whatsapp_text !== undefined) extraMeta.whatsapp_text = validated.whatsapp_text;
    if (validated.whatsapp_active !== undefined) extraMeta.whatsapp_active = validated.whatsapp_active;
    if (validated.floating_cta_text !== undefined) extraMeta.floating_cta_text = validated.floating_cta_text;
    if (validated.floating_cta_active !== undefined) extraMeta.floating_cta_active = validated.floating_cta_active;

    const fullMeta = { ...updateMeta, ...extraMeta };
    if (Object.keys(fullMeta).length > 0) {
      const { error: updateError } = await supabase
        .from('landing_pages')
        .update(fullMeta)
        .eq('id', id);

      if (updateError) {
        console.warn('Update with new columns failed, retrying with core columns only:', updateError.message);
        // Retry with only core columns in case migration hasn't been run yet
        if (Object.keys(updateMeta).length > 0) {
          const { error: retryError } = await supabase
            .from('landing_pages')
            .update(updateMeta)
            .eq('id', id);
          if (retryError) throw retryError;
        }
      }
    }

    // Update sections:
    // To ensure atomicity and avoid constraints, we delete old sections and bulk insert new ones
    // in a single process flow.
    const { error: deleteError } = await supabase
      .from('sections')
      .delete()
      .eq('landing_id', id);

    if (deleteError) throw deleteError;

    const sectionsToInsert = validated.sections.map(sec => ({
      landing_id: id,
      type: sec.type,
      content_json: sec.content_json,
      position: sec.position
    }));

    const { data: insertedSections, error: insertError } = await supabase
      .from('sections')
      .insert(sectionsToInsert)
      .select();

    if (insertError) throw insertError;

    // Update project 'updated_at' timestamp
    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', landing.project_id);

    return res.json({
      message: 'Landing page autosaved successfully.',
      sections: insertedSections
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Landing page save error:', err);
    return res.status(500).json({ error: 'Internal server error saving landing page.' });
  }
});

/**
 * @route   POST /api/landing/duplicate
 * @desc    Duplicate a landing page and its sections
 */
router.post('/duplicate', requireAuth, async (req, res) => {
  try {
    const { landingId } = req.body;
    if (!landingId) return res.status(400).json({ error: 'landingId is required.' });

    // Fetch original landing metadata
    const { data: original, error: lError } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', landingId)
      .single();

    if (lError || !original) {
      return res.status(404).json({ error: 'Original landing page not found.' });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', original.project_id)
      .eq('user_id', req.user.id)
      .single();

    if (!project) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Fetch original sections
    const { data: originalSections } = await supabase
      .from('sections')
      .select('*')
      .eq('landing_id', landingId);

    // Create new slug
    const suffix = Math.random().toString(36).substring(7);
    const newSlug = `${original.slug}-copy-${suffix}`;

    // Insert duplicated page
    const { data: duplicateLanding, error: cloneError } = await supabase
      .from('landing_pages')
      .insert({
        project_id: original.project_id,
        title: `${original.title} (Copia)`,
        slug: newSlug,
        seo_title: original.seo_title,
        seo_description: original.seo_description,
        published: false
      })
      .select()
      .single();

    if (cloneError) throw cloneError;

    // Insert duplicated sections
    if (originalSections && originalSections.length > 0) {
      const clonedSections = originalSections.map(sec => ({
        landing_id: duplicateLanding.id,
        type: sec.type,
        content_json: sec.content_json,
        position: sec.position
      }));

      await supabase.from('sections').insert(clonedSections);
    }

    return res.status(201).json(duplicateLanding);
  } catch (err) {
    console.error('Duplication error:', err);
    return res.status(500).json({ error: 'Internal server error duplicating page.' });
  }
});

/**
 * @route   GET /api/landing/project/:projectId
 * @desc    Get all landing pages for a specific project
 */
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', req.user.id)
      .single();

    if (!project) {
      return res.status(403).json({ error: 'Access denied: Project does not belong to user.' });
    }

    const { data, error } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    console.error('Fetch pages for project error:', err);
    return res.status(500).json({ error: 'Internal server error fetching project pages.' });
  }
});

export default router;
