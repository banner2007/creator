import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { requireAuth } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Zod Schema Validation
const bookSchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format. Expected HH:MM"),
  timezone: z.string().min(1),
  is_grave: z.boolean().default(false),
  issue: z.string().min(1, "El tema a resolver es obligatorio"),
  whatsapp: z.string().min(1, "El número de WhatsApp es obligatorio"),
  details: z.string().optional()
});

// Helper: Get next time slot (consecutive 30-minute block)
function getConsecutiveSlot(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let nextHours = hours;
  let nextMinutes = minutes + 30;
  if (nextMinutes >= 60) {
    nextHours += 1;
    nextMinutes -= 60;
  }
  const nextHoursStr = String(nextHours).padStart(2, '0');
  const nextMinutesStr = String(nextMinutes).padStart(2, '0');
  return `${nextHoursStr}:${nextMinutesStr}`;
}

// Helper: Get previous time slot (preceding 30-minute block)
function getPrecedingSlot(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let prevHours = hours;
  let prevMinutes = minutes - 30;
  if (prevMinutes < 0) {
    prevHours -= 1;
    prevMinutes += 60;
  }
  const prevHoursStr = String(prevHours).padStart(2, '0');
  const prevMinutesStr = String(prevMinutes).padStart(2, '0');
  return `${prevHoursStr}:${prevMinutesStr}`;
}

/**
 * @route   POST /api/support/book
 * @desc    Book a support session
 * @access  Private
 */
router.post('/book', requireAuth, async (req, res) => {
  try {
    const validated = bookSchema.parse(req.body);
    const userId = req.user.id; // From requireAuth middleware

    // Fetch existing bookings for this day
    const { data: bookings, error: fetchError } = await supabase
      .from('support_sessions')
      .select('time, is_grave')
      .eq('day', validated.day);

    if (fetchError) {
      console.error('Error fetching existing bookings:', fetchError);
      return res.status(500).json({ error: 'Error al consultar disponibilidad en el calendario' });
    }

    // Set of all occupied slots
    const occupiedSlots = new Set();
    bookings.forEach(b => {
      occupiedSlots.add(b.time);
      if (b.is_grave) {
        // Blocks the consecutive 30-minute slot
        occupiedSlots.add(getConsecutiveSlot(b.time));
      }
    });

    const targetSlot = validated.time;
    const consecutiveSlot = getConsecutiveSlot(targetSlot);

    // Verify if the target slot is already occupied
    if (occupiedSlots.has(targetSlot)) {
      return res.status(400).json({ error: 'El horario seleccionado ya está ocupado' });
    }

    // If booking a 1-hour slot (is_grave = true), check if consecutive slot is available
    if (validated.is_grave && occupiedSlots.has(consecutiveSlot)) {
      return res.status(400).json({ error: 'Para un fallo grave se requieren 60 minutos seguidos, y el siguiente bloque de tiempo está ocupado' });
    }

    // Save the new support session
    const { data, error: insertError } = await supabase
      .from('support_sessions')
      .insert({
        user_id: userId,
        day: validated.day,
        time: validated.time,
        timezone: validated.timezone,
        is_grave: validated.is_grave,
        issue: validated.issue,
        whatsapp: validated.whatsapp,
        details: validated.details || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting support session:', insertError);
      return res.status(500).json({ error: 'Fallo al registrar el agendamiento del soporte' });
    }

    return res.status(201).json({
      message: 'Sesión de soporte agendada correctamente',
      session: data
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Error de validación', details: err.errors });
    }
    console.error('Booking support session error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/support/sessions
 * @desc    Get all booked sessions of current authenticated user
 * @access  Private
 */
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('support_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      console.error('Error fetching support sessions:', error);
      return res.status(500).json({ error: 'Error al obtener tus sesiones de soporte' });
    }

    return res.json(data);
  } catch (err) {
    console.error('Get sessions error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * @route   GET /api/support/booked-slots
 * @desc    Get all occupied time slots for a specific day (used by frontend to disable hours)
 * @access  Private
 */
router.get('/booked-slots', requireAuth, async (req, res) => {
  try {
    const { day } = req.query;
    if (!day) {
      return res.status(400).json({ error: 'El parámetro query "day" (YYYY-MM-DD) es obligatorio' });
    }

    const { data: bookings, error } = await supabase
      .from('support_sessions')
      .select('time, is_grave')
      .eq('day', day);

    if (error) {
      console.error('Error fetching booked slots:', error);
      return res.status(500).json({ error: 'Error al obtener disponibilidad de horas' });
    }

    // Compile list of all unavailable 30-minute block strings
    const unavailableSlots = [];
    bookings.forEach(b => {
      unavailableSlots.push(b.time);
      if (b.is_grave) {
        unavailableSlots.push(getConsecutiveSlot(b.time));
      }
    });

    return res.json(unavailableSlots);
  } catch (err) {
    console.error('Get booked slots error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
