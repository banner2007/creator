import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore.js';
import { Calendar, Clock, Globe, Check, AlertCircle, Phone, ArrowRight, Video, HelpCircle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// Timezone definitions with offset difference in hours relative to Colombia (UTC-5)
const TIMEZONES = [
  { name: 'Colombia', offsetDiff: 0, label: 'Colombia (UTC-5)' },
  { name: 'Ecuador', offsetDiff: 0, label: 'Ecuador (UTC-5)' },
  { name: 'Perú', offsetDiff: 0, label: 'Perú (UTC-5)' },
  { name: 'Panamá', offsetDiff: 0, label: 'Panamá (UTC-5)' },
  { name: 'México (Centro / CDMX)', offsetDiff: -1, label: 'México (Centro / CDMX) (UTC-6)' },
  { name: 'México (Pacífico / Tijuana)', offsetDiff: -2, label: 'México (Pacífico / Tijuana) (UTC-7)' },
  { name: 'Guatemala', offsetDiff: -1, label: 'Guatemala (UTC-6)' },
  { name: 'El Salvador', offsetDiff: -1, label: 'El Salvador (UTC-6)' },
  { name: 'Honduras', offsetDiff: -1, label: 'Honduras (UTC-6)' },
  { name: 'Nicaragua', offsetDiff: -1, label: 'Nicaragua (UTC-6)' },
  { name: 'Costa Rica', offsetDiff: -1, label: 'Costa Rica (UTC-6)' },
  { name: 'Venezuela', offsetDiff: 1, label: 'Venezuela (UTC-4)' },
  { name: 'Bolivia', offsetDiff: 1, label: 'Bolivia (UTC-4)' },
  { name: 'Chile', offsetDiff: 2, label: 'Chile (UTC-3)' },
  { name: 'Argentina', offsetDiff: 2, label: 'Argentina (UTC-3)' },
  { name: 'Paraguay', offsetDiff: 2, label: 'Paraguay (UTC-3)' },
  { name: 'Uruguay', offsetDiff: 2, label: 'Uruguay (UTC-3)' },
  { name: 'Brasil (São Paulo)', offsetDiff: 2, label: 'Brasil (São Paulo) (UTC-3)' },
  { name: 'República Dominicana', offsetDiff: 1, label: 'República Dominicana (UTC-4)' },
  { name: 'Puerto Rico', offsetDiff: 1, label: 'Puerto Rico (UTC-4)' },
  { name: 'EE.UU. (Este / New York)', offsetDiff: 1, label: 'EE.UU. (Este) (UTC-4)' },
  { name: 'EE.UU. (Centro / Chicago)', offsetDiff: 0, label: 'EE.UU. (Centro) (UTC-5)' },
  { name: 'EE.UU. (Pacífico / Los Ángeles)', offsetDiff: -2, label: 'EE.UU. (Pacífico) (UTC-7)' },
  { name: 'España', offsetDiff: 7, label: 'España (Madrid) (UTC+2)' }
];

// Base time slots (original Colombia time slots)
const BASE_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function SupportPage() {
  const token = useStore(state => state.token);
  
  // Date selection states
  const [datesList, setDatesList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Timezone states
  const [selectedTimezone, setSelectedTimezone] = useState(TIMEZONES[0]);
  
  // Slots states
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null); // base Colombia time slot
  
  // Form states
  const [isGrave, setIsGrave] = useState(false);
  const [issue, setIssue] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Scheduled sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  
  const scrollContainerRef = useRef(null);

  // Generate the next 14 weekdays (Mon-Fri)
  useEffect(() => {
    const list = [];
    let current = new Date();
    
    while (list.length < 14) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Clone date
        list.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }
    
    setDatesList(list);
    if (list.length > 0) {
      setSelectedDate(list[0]);
    }
  }, []);

  // Fetch booked slots for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    
    const fetchBooked = async () => {
      setLoadingSlots(true);
      try {
        const formattedDate = formatDateString(selectedDate);
        const res = await fetch(`/api/support/booked-slots?day=${formattedDate}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setBookedSlots(data);
        }
      } catch (err) {
        console.error('Error fetching booked slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    fetchBooked();
  }, [selectedDate, token]);

  // Fetch all scheduled sessions of current user
  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch('/api/support/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(data);
      }
    } catch (err) {
      console.error('Error fetching support sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  // Format Helper: date string YYYY-MM-DD
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert Colombia base slot to user selected timezone hours
  const convertToLocalTime = (baseTimeStr, offsetDiff) => {
    const [hours, minutes] = baseTimeStr.split(':').map(Number);
    let localHours = hours + offsetDiff;
    
    // Handle wrap-arounds
    if (localHours >= 24) {
      localHours -= 24;
    } else if (localHours < 0) {
      localHours += 24;
    }
    
    const localHoursStr = String(localHours).padStart(2, '0');
    const localMinutesStr = String(minutes).padStart(2, '0');
    return `${localHoursStr}:${localMinutesStr}`;
  };

  // Check if slot is in the past (only relevant for today)
  const isPastSlot = (date, baseTimeStr) => {
    const todayStr = formatDateString(new Date());
    const dateStr = formatDateString(date);
    if (dateStr !== todayStr) return false;
    
    const [hours, minutes] = baseTimeStr.split(':').map(Number);
    const now = new Date();
    
    // We add 15 minutes of buffer time
    const slotTime = new Date();
    slotTime.setHours(hours, minutes, 0, 0);
    
    return now.getTime() > slotTime.getTime() - 15 * 60 * 1000;
  };

  // Handle slot reservation
  const handleOpenBooking = (slot) => {
    setSelectedSlot(slot);
    setErrorMessage('');
    setIsGrave(false);
    setIssue('');
    setWhatsapp('');
    setDetails('');
    setShowModal(true);
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!issue.trim() || !whatsapp.trim()) {
      setErrorMessage('Por favor, completa todos los campos obligatorios');
      return;
    }
    
    setSubmitting(true);
    setErrorMessage('');
    
    try {
      const formattedDate = formatDateString(selectedDate);
      const res = await fetch('/api/support/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          day: formattedDate,
          time: selectedSlot,
          timezone: selectedTimezone.name,
          is_grave: isGrave,
          issue,
          whatsapp,
          details
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setErrorMessage(data.error || 'Ocurrió un error al reservar');
      } else {
        // Success!
        setShowModal(false);
        // Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        
        // Refresh data
        // Refresh booked slots list
        const resSlots = await fetch(`/api/support/booked-slots?day=${formattedDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataSlots = await resSlots.json();
        if (resSlots.ok) {
          setBookedSlots(dataSlots);
        }
        
        // Refresh user sessions
        fetchSessions();
      }
    } catch (err) {
      console.error('Booking request failed:', err);
      setErrorMessage('Error de conexión con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date readable
  const getReadableDayName = (date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  };

  const getReadableMonthName = (date) => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return months[date.getMonth()];
  };

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8 min-h-screen text-slate-100">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            <span>Soporte Técnico</span>
          </h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">
            Agenda una videollamada gratis por Google Meet para resolver tus fallos, dudas y optimizar tus landings.
          </p>
        </div>
        
        {/* Support Agent Info Box */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4 bg-slate-900/60 max-w-md shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
            S
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-200">Sebastián</h4>
            <p className="text-xs text-slate-400 mt-0.5">Soporte Técnico de OptiMedia Studio</p>
            <div className="flex gap-2.5 mt-2 flex-wrap">
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">Gratis</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/20">30 - 60 min</span>
              <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded-full font-semibold border border-white/10 flex items-center gap-0.5"><Video className="w-2.5 h-2.5" /> Google Meet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Booking Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Booking Card - 12 cols */}
        <div className="lg:col-span-12 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/40 backdrop-blur-xl space-y-8">
          
          {/* Day Carousel Selector */}
          <div>
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <span>Elegí un día</span>
            </h3>
            
            <div className="relative">
              <div 
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto pb-3 pr-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth"
              >
                {datesList.map((date, idx) => {
                  const isSelected = selectedDate && formatDateString(selectedDate) === formatDateString(date);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 w-16 py-3.5 rounded-xl border text-center transition-all select-none flex flex-col items-center justify-center ${
                        isSelected 
                          ? 'border-indigo-400 bg-indigo-500/15 ring-2 ring-indigo-400/30' 
                          : 'border-white/5 bg-slate-900/60 hover:border-white/20 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                        {getReadableDayName(date)}
                      </span>
                      <span className="text-lg font-extrabold my-0.5">
                        {date.getDate()}
                      </span>
                      <span className="text-[10px] capitalize opacity-80">
                        {getReadableMonthName(date)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timezone Selector & Slots Grid Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Horarios en hora de Colombia (UTC-5) · Almuerzo 13:00–14:00 no disponible
                </span>
              </p>
            </div>
            
            {/* Timezone Selector Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <span>Ver en mi zona:</span>
              </span>
              <select
                value={selectedTimezone.name}
                onChange={(e) => {
                  const zone = TIMEZONES.find(z => z.name === e.target.value);
                  if (zone) setSelectedTimezone(zone);
                }}
                className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-400 focus:outline-none cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.name} value={tz.name}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots Grid */}
          <div className="relative">
            {loadingSlots ? (
              <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-sm">Consultando espacios disponibles...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3.5">
                {BASE_SLOTS.map((baseSlot) => {
                  const isBooked = bookedSlots.includes(baseSlot);
                  const isPast = selectedDate && isPastSlot(selectedDate, baseSlot);
                  const isDisabled = isBooked || isPast;
                  
                  // Convert time for display
                  const localTimeDisplay = convertToLocalTime(baseSlot, selectedTimezone.offsetDiff);
                  
                  return (
                    <button
                      key={baseSlot}
                      disabled={isDisabled}
                      onClick={() => handleOpenBooking(baseSlot)}
                      className={`min-h-12 py-2 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center leading-tight border ${
                        isDisabled
                          ? 'bg-slate-900/40 text-slate-500 border-white/5 cursor-not-allowed line-through'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 shadow-sm active:scale-95'
                      }`}
                    >
                      <span className="text-sm font-bold">{localTimeDisplay}</span>
                      {selectedTimezone.offsetDiff !== 0 && (
                        <span className="text-[9px] opacity-60 mt-0.5">Col: {baseSlot}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Booking Form Modal Dialog */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl z-10 space-y-6 overflow-y-auto max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-400" />
                  <span>Confirmar sesión</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Completa los datos para agendar tu llamada con Sebastián.
                </p>
              </div>

              {/* Slot details summary */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Fecha y Hora</span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-200">
                  <span className="font-bold text-sm">
                    {selectedDate && selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="font-bold text-indigo-400 text-sm">
                    {selectedSlot && convertToLocalTime(selectedSlot, selectedTimezone.offsetDiff)}
                    {selectedTimezone.offsetDiff !== 0 && ` (${selectedTimezone.name})`}
                  </span>
                </div>
                {selectedTimezone.offsetDiff !== 0 && (
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Equivale a las {selectedSlot} en hora de Colombia.
                  </span>
                )}
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBookSession} className="space-y-4">
                
                {/* Fallo Grave Checkbox Option */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900/80 cursor-pointer transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={isGrave}
                    onChange={(e) => setIsGrave(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-500 bg-slate-800 border-white/10 focus:ring-indigo-500 focus:ring-offset-slate-950 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Mi fallo es grave (1 hora)</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Toma dos espacios seguidos (60 min). Verificaremos si ambos están libres al enviar.</span>
                  </div>
                </label>

                {/* Bug / Issue Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>¿Qué fallo o tema querés resolver?</span>
                    <span className="text-red-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: error al crear producto / configurar píxel"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    className="w-full glass-input text-sm px-4 py-2.5 rounded-xl bg-slate-900/50"
                  />
                </div>

                {/* WhatsApp input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <span>Tu WhatsApp (con indicativo de país)</span>
                    <span className="text-red-400 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: +57 300 123 4567"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full glass-input text-sm pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/50"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Sebastián te escribirá por WhatsApp para coordinar y pasarte el enlace de Google Meet.
                  </span>
                </div>

                {/* Details text area */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Detalles (opcional)</label>
                  <textarea
                    placeholder="Contanos más para que Sebastián llegue preparado..."
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full glass-input text-sm px-4 py-2.5 rounded-xl bg-slate-900/50 resize-none"
                  />
                </div>

                {/* Error message */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 py-3 rounded-xl font-bold text-xs transition-colors border border-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Agendando...</span>
                      </>
                    ) : (
                      <>
                        <span>Reservar sesión gratis</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scheduled Sessions List Section */}
      <div className="space-y-4 pt-6 border-t border-white/5">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <span>Mis sesiones de soporte</span>
        </h3>
        
        {loadingSessions ? (
          <div className="flex justify-center items-center py-10 gap-2.5 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-xs">Cargando tus agendamientos...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl border border-white/5 bg-slate-950/20">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aún no hay sesiones agendadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((sess) => (
              <div 
                key={sess.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/30 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-bold border border-indigo-500/20 flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" />
                      <span>Google Meet</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-white/5">
                      {sess.is_grave ? 'Fallo Grave (60 min)' : 'Soporte Estándar (30 min)'}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-sm text-slate-200 mt-1">
                    {sess.issue}
                  </h4>
                  
                  {sess.details && (
                    <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/20 p-2 rounded-lg border border-white/5">
                      "{sess.details}"
                    </p>
                  )}
                </div>
                
                <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold text-slate-300">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>{sess.day}</span>
                    <span className="text-slate-500">•</span>
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>{sess.time} (Col)</span>
                  </div>
                  
                  <div className="text-[10px] opacity-75">
                    WhatsApp: {sess.whatsapp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
