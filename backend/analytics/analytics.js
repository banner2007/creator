import { Router } from 'express';
import { supabase } from '../server.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Helper to update conversion rate
 */
function calculateConversion(visits, clicks) {
  if (visits === 0) return 0.00;
  const rate = (clicks / visits) * 100;
  return parseFloat(rate.toFixed(2));
}

/**
 * @route   POST /api/analytics/visit
 * @desc    Track page visit (Public endpoint triggered by compiled landing HTML)
 */
router.post('/visit', async (req, res) => {
  try {
    const { landingId } = req.body;
    if (!landingId) return res.status(400).json({ error: 'landingId is required.' });

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch existing daily record
    const { data: record, error: fetchError } = await supabase
      .from('analytics')
      .select('*')
      .eq('landing_id', landingId)
      .eq('date', todayStr)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (record) {
      // Update existing record
      const nextVisits = record.visits + 1;
      const nextConversion = calculateConversion(nextVisits, record.clicks);

      await supabase
        .from('analytics')
        .update({
          visits: nextVisits,
          conversion: nextConversion
        })
        .eq('id', record.id);
    } else {
      // Insert new record
      await supabase
        .from('analytics')
        .insert({
          landing_id: landingId,
          date: todayStr,
          visits: 1,
          clicks: 0,
          conversion: 0.00
        });
    }

    return res.json({ success: true, message: 'Visit registered successfully' });
  } catch (err) {
    console.error('Track visit error:', err);
    return res.status(500).json({ error: 'Internal server error tracking visit.' });
  }
});

/**
 * @route   POST /api/analytics/click
 * @desc    Track call-to-action click / conversion (Public endpoint triggered by landing button)
 */
router.post('/click', async (req, res) => {
  try {
    const { landingId, type } = req.body;
    if (!landingId) return res.status(400).json({ error: 'landingId is required.' });

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch existing daily record
    const { data: record, error: fetchError } = await supabase
      .from('analytics')
      .select('*')
      .eq('landing_id', landingId)
      .eq('date', todayStr)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (record) {
      // Update existing record
      const nextClicks = record.clicks + 1;
      const nextConversion = calculateConversion(record.visits, nextClicks);

      await supabase
        .from('analytics')
        .update({
          clicks: nextClicks,
          conversion: nextConversion
        })
        .eq('id', record.id);
    } else {
      // Insert new record (in case click happens before visit registered, though rare)
      await supabase
        .from('analytics')
        .insert({
          landing_id: landingId,
          date: todayStr,
          visits: 1,
          clicks: 1,
          conversion: 100.00
        });
    }

    // Capture webhook lead data if type was a form capture
    if (type === 'lead_form' && process.env.MAKE_LEAD_WEBHOOK_URL) {
      // Send to Make.com lead integration
      try {
        await axios.post(process.env.MAKE_LEAD_WEBHOOK_URL, {
          landingId,
          event: 'lead_captured',
          timestamp: new Date().toISOString(),
          metadata: req.body.metadata || {}
        });
      } catch (err) {
        console.error('[Analytics] Lead webhook trigger failed:', err.message);
      }
    }

    return res.json({ success: true, message: 'Click registered successfully' });
  } catch (err) {
    console.error('Track click error:', err);
    return res.status(500).json({ error: 'Internal server error tracking click.' });
  }
});

/**
 * @route   GET /api/analytics/:landingId
 * @desc    Get analytics summary and chart trends for dashboard
 */
router.get('/:landingId', requireAuth, async (req, res) => {
  try {
    const { landingId } = req.params;

    // Verify ownership first
    const { data: landing, error: lError } = await supabase
      .from('landing_pages')
      .select('id, project_id')
      .eq('id', landingId)
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
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Retrieve analytics records
    const { data: records, error: aError } = await supabase
      .from('analytics')
      .select('*')
      .eq('landing_id', landingId)
      .order('date', { ascending: true });

    if (aError) throw aError;

    // Compute aggregations
    let totalVisits = 0;
    let totalClicks = 0;
    records.forEach(r => {
      totalVisits += r.visits;
      totalClicks += r.clicks;
    });

    const averageConversion = calculateConversion(totalVisits, totalClicks);

    return res.json({
      summary: {
        totalVisits,
        totalClicks,
        conversionRate: averageConversion
      },
      trends: records // Array of daily records for chart plotting
    });
  } catch (err) {
    console.error('Fetch analytics error:', err);
    return res.status(500).json({ error: 'Internal server error fetching analytics.' });
  }
});

export default router;
