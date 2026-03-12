@extends('layouts.dashboard')
@section('title', ($id ? 'Editar' : 'Nueva') . ' Conferencia - OpenPapers')

@section('content')
<div x-data="conferenceFormPage({{ $id ?? 'null' }})" x-init="init()">

    {{-- Back --}}
    <a href="{{ route('dashboard.conferences') }}" class="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-6 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a conferencias
    </a>

    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary" x-text="conferenceId ? 'Editar conferencia' : 'Nueva conferencia'"></h1>
    </div>

    {{-- Loading (edit mode) --}}
    <div x-show="loading" class="flex justify-center py-16 text-text-muted">
        <svg class="animate-spin w-6 h-6 mr-3 text-accent" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        Cargando…
    </div>

    {{-- Alert --}}
    <div x-show="alert.msg" x-transition class="mb-6 px-4 py-3 rounded-lg text-sm font-medium" :class="alert.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'" x-text="alert.msg"></div>

    <form x-show="!loading" @submit.prevent="submitForm()" class="space-y-6">

        {{-- Basic info --}}
        <div class="bg-bg-card border border-border-primary rounded-xl p-6">
            <h2 class="text-lg font-heading font-semibold text-text-primary mb-5">Información básica</h2>
            <div class="grid sm:grid-cols-2 gap-5">

                <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Nombre <span class="text-red-400">*</span></label>
                    <input type="text" x-model="form.name" @input="autoSlug()" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition" placeholder="Ej. International Conference on AI">
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Slug <span class="text-red-400">*</span></label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">/cfp/</span>
                        <input type="text" x-model="form.slug" required pattern="[a-z0-9-]+" class="w-full bg-bg-secondary border border-border-primary rounded-lg pl-14 pr-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition" placeholder="icai-2026">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Edición</label>
                    <input type="text" x-model="form.edition" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition" placeholder="Ej. 15th">
                </div>

                <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Descripción</label>
                    <textarea x-model="form.description" rows="3" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition resize-y" placeholder="Descripción breve de la conferencia…"></textarea>
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Lugar</label>
                    <input type="text" x-model="form.location" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition" placeholder="Ciudad, País / Online">
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Sitio web</label>
                    <input type="url" x-model="form.website_url" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition" placeholder="https://…">
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">URL del logo</label>
                    <input type="url" x-model="form.logo_url" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition" placeholder="https://…">
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Revisores mínimos por envío</label>
                    <input type="number" min="1" max="10" x-model.number="form.min_reviewers" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Tamaño máximo de archivo (MB)</label>
                    <input type="number" min="1" max="50" x-model.number="form.max_file_size_mb" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>

            </div>

            {{-- Toggles --}}
            <div class="flex flex-wrap gap-6 mt-5 pt-5 border-t border-border-primary">
                <label class="flex items-center gap-3 cursor-pointer">
                    <button type="button" @click="form.is_active = !form.is_active" :class="form.is_active ? 'bg-accent' : 'bg-bg-secondary border border-border-primary'" class="w-10 h-6 rounded-full transition relative flex-shrink-0">
                        <span :class="form.is_active ? 'translate-x-5' : 'translate-x-1'" class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                    </button>
                    <span class="text-sm text-text-secondary">Conferencia activa</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                    <button type="button" @click="form.is_double_blind = !form.is_double_blind" :class="form.is_double_blind ? 'bg-accent' : 'bg-bg-secondary border border-border-primary'" class="w-10 h-6 rounded-full transition relative flex-shrink-0">
                        <span :class="form.is_double_blind ? 'translate-x-5' : 'translate-x-1'" class="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"></span>
                    </button>
                    <span class="text-sm text-text-secondary">Revisión doble-ciego</span>
                </label>
            </div>
        </div>

        {{-- Dates --}}
        <div class="bg-bg-card border border-border-primary rounded-xl p-6">
            <h2 class="text-lg font-heading font-semibold text-text-primary mb-5">Fechas</h2>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Inicio del evento</label>
                    <input type="date" x-model="form.start_date" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Fin del evento</label>
                    <input type="date" x-model="form.end_date" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Deadline de envíos <span class="text-red-400">*</span></label>
                    <input type="date" x-model="form.submission_deadline" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Fecha de notificación</label>
                    <input type="date" x-model="form.notification_date" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1.5">Camera-ready deadline</label>
                    <input type="date" x-model="form.camera_ready_date" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                </div>
            </div>
        </div>

        {{-- Tracks --}}
        <div class="bg-bg-card border border-border-primary rounded-xl p-6">
            <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-heading font-semibold text-text-primary">Tracks</h2>
                <button type="button" @click="addTrack()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover text-sm transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Añadir track
                </button>
            </div>

            <div class="space-y-3">
                <template x-for="(track, idx) in form.tracks" :key="idx">
                    <div class="flex gap-3 p-4 bg-bg-secondary rounded-lg border border-border-primary">
                        <div class="flex-1 grid sm:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-text-muted mb-1">Nombre del track <span class="text-red-400">*</span></label>
                                <input type="text" x-model="track.name" required class="w-full bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition">
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-text-muted mb-1">Descripción</label>
                                <input type="text" x-model="track.description" class="w-full bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent transition" placeholder="Opcional">
                            </div>
                        </div>
                        <button type="button" @click="removeTrack(idx)" class="self-start mt-6 p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition flex-shrink-0" title="Eliminar track">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </template>

                <div x-show="form.tracks.length === 0" class="py-6 text-center text-text-muted text-sm border border-dashed border-border-primary rounded-lg">
                    Sin tracks. Añade al menos uno para categorizar los envíos.
                </div>
            </div>
        </div>

        {{-- Actions --}}
        <div class="flex items-center justify-between pt-2">
            <a href="{{ route('dashboard.conferences') }}" class="px-5 py-2.5 bg-bg-card border border-border-primary rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition text-sm">
                Cancelar
            </a>
            <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-accent hover:bg-accent/80 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                <svg x-show="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                <span x-text="conferenceId ? 'Guardar cambios' : 'Crear conferencia'"></span>
            </button>
        </div>

    </form>
</div>

@push('scripts')
<script>
function conferenceFormPage(conferenceId) {
    return {
        conferenceId,
        loading: !!conferenceId,
        saving: false,
        alert: { msg: '', type: '' },
        form: {
            name: '',
            slug: '',
            edition: '',
            description: '',
            location: '',
            website_url: '',
            logo_url: '',
            start_date: '',
            end_date: '',
            submission_deadline: '',
            notification_date: '',
            camera_ready_date: '',
            is_active: true,
            is_double_blind: false,
            min_reviewers: 2,
            max_file_size_mb: 10,
            tracks: [],
        },

        async init() {
            if (!this.conferenceId) return;
            try {
                const conferences = await api.get('/api/dashboard/conferences');
                const conf = Array.isArray(conferences) ? conferences.find(c => c.id == this.conferenceId) : null;
                if (conf) this.fillForm(conf);
            } catch (e) {
                this.showAlert('Error al cargar la conferencia', 'error');
            } finally {
                this.loading = false;
            }
        },
        fillForm(conf) {
            const dateStr = v => v ? v.substring(0, 10) : '';
            this.form.name               = conf.name               ?? '';
            this.form.slug               = conf.slug               ?? '';
            this.form.edition            = conf.edition            ?? '';
            this.form.description        = conf.description        ?? '';
            this.form.location           = conf.location           ?? '';
            this.form.website_url        = conf.website_url        ?? '';
            this.form.logo_url           = conf.logo_url           ?? '';
            this.form.start_date         = dateStr(conf.start_date);
            this.form.end_date           = dateStr(conf.end_date);
            this.form.submission_deadline = dateStr(conf.submission_deadline);
            this.form.notification_date  = dateStr(conf.notification_date);
            this.form.camera_ready_date  = dateStr(conf.camera_ready_date);
            this.form.is_active          = !!conf.is_active;
            this.form.is_double_blind    = !!conf.is_double_blind;
            this.form.min_reviewers      = conf.min_reviewers      ?? 2;
            this.form.max_file_size_mb   = conf.max_file_size_mb   ?? 10;
            this.form.tracks             = (conf.tracks ?? []).map(t => ({ name: t.name, description: t.description || '' }));
        },
        autoSlug() {
            if (!this.conferenceId) {
                this.form.slug = this.form.name
                    .toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
            }
        },
        addTrack() {
            this.form.tracks.push({ name: '', description: '' });
        },
        removeTrack(idx) {
            this.form.tracks.splice(idx, 1);
        },
        async submitForm() {
            this.saving = true;
            try {
                const payload = { ...this.form };
                // Strip empty optional dates
                ['start_date','end_date','notification_date','camera_ready_date'].forEach(k => {
                    if (!payload[k]) payload[k] = null;
                });

                if (this.conferenceId) {
                    await api.put('/api/dashboard/conferences/' + this.conferenceId, payload);
                    this.showAlert('Conferencia actualizada correctamente', 'success');
                } else {
                    const res = await api.post('/api/dashboard/conferences', payload);
                    this.showAlert('Conferencia creada correctamente', 'success');
                    setTimeout(() => window.location = '/dashboard/conferences/' + res.id + '/edit', 1500);
                }
            } catch (e) {
                const errs = e?.response?.data?.errors;
                const msg  = errs ? Object.values(errs).flat().join(' | ') : (e?.response?.data?.message || 'Error al guardar');
                this.showAlert(msg, 'error');
            } finally {
                this.saving = false;
            }
        },
        showAlert(msg, type) {
            this.alert = { msg, type };
            if (type === 'success') setTimeout(() => this.alert = { msg: '', type: '' }, 4000);
        },
    };
}
</script>
@endpush
@endsection
