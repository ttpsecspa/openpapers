@extends('layouts.dashboard')
@section('title', 'Usuarios - OpenPapers')

@section('content')
<div x-data="usersPage()" x-init="loadData()">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary">Usuarios</h1>
        <button @click="openInviteModal()" class="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-semibold transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Invitar usuario
        </button>
    </div>

    {{-- Alert --}}
    <div x-show="alert.msg" x-transition class="mb-5 px-4 py-3 rounded-lg text-sm font-medium" :class="alert.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'" x-text="alert.msg"></div>

    {{-- Filters --}}
    <div class="flex flex-wrap gap-3 mb-6">
        <select x-model="filters.role" @change="loadData()" class="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm">
            <option value="">Todos los roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="reviewer">Revisor</option>
            <option value="author">Autor</option>
        </select>
        <input x-model="filters.search" @input.debounce.300ms="loadData()" placeholder="Buscar nombre o email…" class="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm w-64 placeholder-text-muted focus:outline-none focus:border-accent transition">
    </div>

    {{-- Table --}}
    <div class="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <div x-show="loading" class="flex justify-center py-10 text-text-muted">
            <svg class="animate-spin w-5 h-5 mr-2 text-accent" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            Cargando…
        </div>
        <div x-show="!loading" class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-bg-secondary border-b border-border-primary">
                    <tr>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Nombre</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Email</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Afiliación</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Rol</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Estado</th>
                        <th class="text-right px-4 py-3 text-text-muted font-medium">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="user in users" :key="user.id">
                        <tr class="border-b border-border-primary hover:bg-bg-hover transition">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0" x-text="user.full_name?.charAt(0)?.toUpperCase() || '?'"></div>
                                    <span class="text-text-primary font-medium" x-text="user.full_name"></span>
                                </div>
                            </td>
                            <td class="px-4 py-3 text-text-secondary" x-text="user.email"></td>
                            <td class="px-4 py-3 text-text-muted hidden md:table-cell" x-text="user.affiliation || '—'"></td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="roleClass(user.role)" x-text="roleLabel(user.role)"></span>
                            </td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="user.is_active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'" x-text="user.is_active ? 'Activo' : 'Inactivo'"></span>
                            </td>
                            <td class="px-4 py-3">
                                <div class="flex items-center justify-end gap-2">
                                    {{-- Edit role --}}
                                    <button @click="openEditModal(user)" class="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition" title="Editar">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                    </button>
                                    {{-- Toggle active --}}
                                    <button @click="toggleActive(user)" :title="user.is_active ? 'Desactivar' : 'Activar'" class="p-1.5 rounded-lg transition" :class="user.is_active ? 'text-text-muted hover:text-red-400 hover:bg-red-900/20' : 'text-text-muted hover:text-green-400 hover:bg-green-900/20'">
                                        <svg x-show="user.is_active" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                                        <svg x-show="!user.is_active" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            <div x-show="users.length === 0 && !loading" class="p-10 text-center text-text-muted">No hay usuarios que coincidan con los filtros</div>
        </div>
    </div>

    {{-- ===== INVITE MODAL ===== --}}
    <div x-show="modals.invite" x-transition.opacity class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @keydown.escape.window="modals.invite = false">
        <div @click.stop class="bg-bg-card border border-border-primary rounded-2xl w-full max-w-lg shadow-2xl" x-transition.scale>
            <div class="flex items-center justify-between p-5 border-b border-border-primary">
                <h3 class="text-lg font-heading font-semibold text-text-primary">Invitar usuario a conferencia</h3>
                <button @click="modals.invite = false" class="text-text-muted hover:text-text-primary transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <form @submit.prevent="submitInvite()" class="p-5 space-y-4">
                <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-text-secondary mb-1.5">Email <span class="text-red-400">*</span></label>
                        <input type="email" x-model="inviteForm.email" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-secondary mb-1.5">Nombre completo <span class="text-red-400">*</span></label>
                        <input type="text" x-model="inviteForm.full_name" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Afiliación</label>
                    <input type="text" x-model="inviteForm.affiliation" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition">
                </div>
                <div class="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-text-secondary mb-1.5">Conferencia <span class="text-red-400">*</span></label>
                        <select x-model="inviteForm.conference_id" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                            <option value="">Seleccionar…</option>
                            <template x-for="conf in conferences" :key="conf.id">
                                <option :value="conf.id" x-text="conf.name"></option>
                            </template>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-text-secondary mb-1.5">Rol en conferencia <span class="text-red-400">*</span></label>
                        <select x-model="inviteForm.role" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                            <option value="reviewer">Revisor</option>
                            <option value="chair">Chair</option>
                        </select>
                    </div>
                </div>

                {{-- Temp password result --}}
                <div x-show="inviteResult.tempPassword" class="p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg text-sm">
                    <p class="text-yellow-400 font-medium mb-1">Usuario creado. Contraseña temporal:</p>
                    <code class="text-yellow-300 font-mono" x-text="inviteResult.tempPassword"></code>
                    <p class="text-yellow-600 text-xs mt-1">Comparte esta contraseña de forma segura con el usuario.</p>
                </div>

                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" @click="modals.invite = false" class="px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover text-sm transition">Cancelar</button>
                    <button type="submit" :disabled="savingInvite" class="px-5 py-2 bg-accent hover:bg-accent/80 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                        <svg x-show="savingInvite" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        Invitar
                    </button>
                </div>
            </form>
        </div>
    </div>

    {{-- ===== EDIT ROLE MODAL ===== --}}
    <div x-show="modals.edit" x-transition.opacity class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @keydown.escape.window="modals.edit = false">
        <div @click.stop class="bg-bg-card border border-border-primary rounded-2xl w-full max-w-sm shadow-2xl" x-transition.scale>
            <div class="flex items-center justify-between p-5 border-b border-border-primary">
                <h3 class="text-lg font-heading font-semibold text-text-primary">Editar usuario</h3>
                <button @click="modals.edit = false" class="text-text-muted hover:text-text-primary transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <form @submit.prevent="submitEdit()" class="p-5 space-y-4">
                <p class="text-sm text-text-muted">Editando: <span class="text-text-primary font-medium" x-text="editForm.full_name"></span></p>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Rol global</label>
                    <select x-model="editForm.role" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                        <option value="author">Autor</option>
                        <option value="reviewer">Revisor</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Afiliación</label>
                    <input type="text" x-model="editForm.affiliation" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition">
                </div>
                <div class="flex justify-end gap-3 pt-2">
                    <button type="button" @click="modals.edit = false" class="px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover text-sm transition">Cancelar</button>
                    <button type="submit" :disabled="savingEdit" class="px-5 py-2 bg-accent hover:bg-accent/80 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                        <svg x-show="savingEdit" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        Guardar
                    </button>
                </div>
            </form>
        </div>
    </div>

</div>

@push('scripts')
<script>
function usersPage() {
    return {
        users: [],
        conferences: [],
        loading: true,
        savingInvite: false,
        savingEdit: false,
        alert: { msg: '', type: '' },
        filters: { role: '', search: '' },
        modals: { invite: false, edit: false },
        inviteForm: { email: '', full_name: '', affiliation: '', conference_id: '', role: 'reviewer' },
        inviteResult: { tempPassword: '' },
        editForm: { id: null, full_name: '', role: '', affiliation: '' },

        async loadData() {
            this.loading = true;
            try {
                let url = '/api/dashboard/users?';
                if (this.filters.role)   url += 'role='   + this.filters.role + '&';
                if (this.filters.search) url += 'search=' + encodeURIComponent(this.filters.search) + '&';
                this.users = await api.get(url);
            } catch (e) {
                this.showAlert('Error al cargar usuarios', 'error');
            } finally {
                this.loading = false;
            }
        },
        async loadConferences() {
            try {
                this.conferences = await api.get('/api/dashboard/conferences');
            } catch (e) { console.error(e); }
        },
        openInviteModal() {
            this.inviteResult = { tempPassword: '' };
            this.inviteForm = { email: '', full_name: '', affiliation: '', conference_id: '', role: 'reviewer' };
            if (!this.conferences.length) this.loadConferences();
            this.modals.invite = true;
        },
        openEditModal(user) {
            this.editForm = { id: user.id, full_name: user.full_name, role: user.role, affiliation: user.affiliation || '' };
            this.modals.edit = true;
        },
        async submitInvite() {
            this.savingInvite = true;
            this.inviteResult = { tempPassword: '' };
            try {
                const res = await api.post('/api/dashboard/users/invite', this.inviteForm);
                if (res.temporary_password) {
                    this.inviteResult.tempPassword = res.temporary_password;
                } else {
                    this.modals.invite = false;
                }
                this.showAlert(res.message || 'Usuario invitado correctamente', 'success');
                this.loadData();
            } catch (e) {
                const msg = e?.response?.data?.error || 'Error al invitar usuario';
                this.showAlert(msg, 'error');
            } finally {
                this.savingInvite = false;
            }
        },
        async submitEdit() {
            this.savingEdit = true;
            try {
                await api.put('/api/dashboard/users/' + this.editForm.id, {
                    role: this.editForm.role,
                    affiliation: this.editForm.affiliation,
                });
                const idx = this.users.findIndex(u => u.id === this.editForm.id);
                if (idx !== -1) {
                    this.users[idx].role        = this.editForm.role;
                    this.users[idx].affiliation = this.editForm.affiliation;
                }
                this.modals.edit = false;
                this.showAlert('Usuario actualizado', 'success');
            } catch (e) {
                const msg = e?.response?.data?.error || 'Error al actualizar usuario';
                this.showAlert(msg, 'error');
            } finally {
                this.savingEdit = false;
            }
        },
        async toggleActive(user) {
            try {
                await api.put('/api/dashboard/users/' + user.id, { is_active: !user.is_active });
                user.is_active = !user.is_active;
                this.showAlert(user.is_active ? 'Usuario activado' : 'Usuario desactivado', 'success');
            } catch (e) {
                this.showAlert('Error al cambiar estado', 'error');
            }
        },
        roleLabel(r) {
            const m = { superadmin: 'Superadmin', admin: 'Admin', reviewer: 'Revisor', author: 'Autor' };
            return m[r] || r;
        },
        roleClass(r) {
            const m = {
                superadmin: 'bg-purple-900/30 text-purple-400',
                admin:      'bg-blue-900/30 text-blue-400',
                reviewer:   'bg-yellow-900/30 text-yellow-400',
                author:     'bg-gray-900/30 text-gray-400',
            };
            return m[r] || '';
        },
        showAlert(msg, type) {
            this.alert = { msg, type };
            setTimeout(() => this.alert = { msg: '', type: '' }, 4000);
        },
    };
}
</script>
@endpush
@endsection
