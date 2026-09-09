import React, { useState } from 'react';
import { Users, UserPlus, Shield, Trash2, Mail, Check } from 'lucide-react';

export default function Equipo() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [sent, setSent] = useState(false);

  const members = [
    { id: 1, name: 'Juan Pérez (Tú)', email: 'juan@admin.com', role: 'Administrador' },
    { id: 2, name: 'María Gómez', email: 'maria@diseño.com', role: 'Diseñador/Editor' }
  ];

  const handleInvite = (e) => {
    e.preventDefault();
    setSent(true);
    setInviteEmail('');
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div class="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
          <Users class="w-8 h-8 text-fuchsia-400" />
          <span>Gestión de Equipo</span>
        </h2>
        <p class="text-slate-400 mt-2 text-sm">
          Invita a tus colaboradores, diseñadores y administradores para trabajar de forma conjunta en tus landing pages y campañas.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left - Members list */}
        <div class="md:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
          <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
            Miembros del Equipo
          </h3>

          <div class="divide-y divide-white/5">
            {members.map(member => (
              <div key={member.id} class="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div class="min-w-0">
                  <h4 class="font-bold text-sm text-slate-200">{member.name}</h4>
                  <p class="text-xs text-slate-500 truncate">{member.email}</p>
                </div>
                <div class="flex items-center gap-4">
                  <span class="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Shield class="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>{member.role}</span>
                  </span>
                  {member.id !== 1 && (
                    <button class="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Invite form */}
        <div class="md:col-span-5 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10">
          <form onSubmit={handleInvite} class="space-y-5">
            <h3 class="font-bold text-lg text-slate-200 border-b border-white/5 pb-4">
              Invitar Colaborador
            </h3>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Correo Electrónico</label>
              <div class="relative flex items-center">
                <Mail class="w-4 h-4 text-slate-500 absolute left-3" />
                <input 
                  type="email" 
                  required
                  placeholder="ejemplo@equipo.com"
                  class="glass-input pl-9 w-full"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-400">Rol asignado</label>
              <select 
                class="glass-input w-full bg-slate-900 text-slate-300"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              >
                <option value="admin">Administrador</option>
                <option value="editor">Diseñador / Editor</option>
                <option value="viewer">Analista de Métricas</option>
              </select>
            </div>

            <button 
              type="submit"
              class="w-full py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-lg text-white transition-all flex items-center justify-center gap-2"
            >
              {sent ? <Check class="w-4 h-4" /> : <UserPlus class="w-4 h-4" />}
              <span>{sent ? 'Invitación Enviada' : 'Enviar Invitación'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
