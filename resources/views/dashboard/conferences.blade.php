@extends('layouts.dashboard')
@section('title', 'Conferencias - OpenPapers')

@section('content')
<div x-data="conferencesPage()" x-init="loadData()">

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary">Conferencias</h1>
        @if(auth()->user()->isSuperAdmin())
        <a href="{{ route('dashboard.conferences.create') }}" class="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-semibold transition">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Nueva conferencia
        </a>
        @endif
    </div>

    {{-- Alert --}}
    <div x-show="alert.msg" x-transition class="mb-5 px-4 py-3 rounded-lg text-sm font-medium" :class="alert.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'" x-text="alert.msg"></div>

    {{-- Loading --}}
    <div x-show="loading" class="flex justify-center py-16 text-text-muted">
        <svg class="animate-spin w-6 h-6 mr-3 text-accent" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        Cargando…
    </div>

    {{-- Conference cards --}}
    <div x-show="!loading" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <template x-for="conf in conferences" :key="conf.id">
            <div class="bg-bg-card border border-border-primary rounded-xl p-5 hover:border-accent/30 transition flex flex-col">

                {{-- Header row --}}
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex-1 min-w-0">
                        <h2 class="text-text-primary font-heading font-semibold truncate" x-text="conf.name"></h2>
                        <p class="text-text-muted text-xs mt-0.5" x-text="conf.edition ? 'Edición: ' + conf.edition : ''"></p>
                    </div>
                    <span class="flex-shrink-0 px-2 py-1 rounded-full text-xs font-semibold" :class="conf.is_active ? 'bg-green-900/30 text-green-400' : 'bg-gray-900/30 text-gray-400'" x-text="conf.is_active ? 'Activa' : 'Inactiva'"></span>
                </div>

                {{-- Dates --}}
                <div class="space-y-1.5 mb-4 flex-1">
                    <div x-show="conf.location" class="flex items-center gap-2 text-sm text-text-muted">
                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span x-text="conf.location"></span>
                    </div>
                    <div x-show="conf.start_date" class="flex items-center gap-2 text-sm text-text-muted">
                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span x-text="formatDate(conf.start_date) + (conf.end_date ? ' – ' + formatDate(conf.end_date) : '')"></span>
                    </div>
                    <div x-show="conf.submission_deadline" class="flex items-center gap-2 text-sm" :class="isDeadlineSoon(conf.submission_deadline) ? 'text-yellow-400' : 'text-text-muted'">
                        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>Deadline: <span x-text="formatDate(conf.submission_deadline)"></span></span>
                    </div>
                </div>

                {{-- Stats row --}}
                <div class="flex gap-4 pt-4 border-t border-border-primary text-sm text-text-muted mb-4">
                    <div>
                        <span class="text-text-primary font-semibold" x-text="conf.submissions_count ?? 0"></span>
                        <span class="ml-1">envíos</span>
                    </div>
                    <div>
                        <span class="text-text-primary font-semibold" x-text="conf.tracks_count ?? 0"></span>
                        <span class="ml-1">tracks</span>
                    </div>
                </div>

                {{-- Actions --}}
                <div class="flex gap-2">
                    <a :href="'/dashboard/conferences/' + conf.id + '/edit'" class="flex-1 text-center px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover text-sm transition">
                        Editar
                    </a>
                    <a :href="'/cfp/' + conf.slug" target="_blank" class="p-2 bg-bg-secondary border border-border-primary rounded-lg text-text-muted hover:text-accent hover:border-accent/50 transition" title="Ver página pública">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    </a>
                    @if(auth()->user()->isSuperAdmin())
                    <button @click="confirmDelete(conf)" class="p-2 bg-bg-secondary border border-border-primary rounded-lg text-text-muted hover:text-red-400 hover:border-red-800 transition" title="Eliminar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                    @endif
                </div>
            </div>
        </template>

        {{-- Empty state --}}
        <div x-show="conferences.length === 0 && !loading" class="sm:col-span-2 xl:col-span-3 bg-bg-card border border-border-primary rounded-xl p-12 text-center text-text-muted">
            <svg class="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <p class="mb-4">No hay conferencias</p>
            @if(auth()->user()->isSuperAdmin())
            <a href="{{ route('dashboard.conferences.create') }}" class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent/80 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Crear primera conferencia
            </a>
            @endif
        </div>
    </div>

    {{-- Delete confirm modal --}}
    <div x-show="deleteTarget" x-transition.opacity class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @keydown.escape.window="deleteTarget = null">
        <div @click.stop class="bg-bg-card border border-border-primary rounded-2xl w-full max-w-sm shadow-2xl p-6" x-transition.scale>
            <h3 class="text-lg font-heading font-semibold text-text-primary mb-2">Eliminar conferencia</h3>
            <p class="text-text-secondary text-sm mb-6">
                ¿Eliminar "<span class="text-text-primary font-medium" x-text="deleteTarget?.name"></span>"? Esta acción no se puede deshacer.
            </p>
            <div class="flex justify-end gap-3">
                <button @click="deleteTarget = null" class="px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover text-sm transition">Cancelar</button>
                <button @click="doDelete()" :disabled="deleting" class="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                    <svg x-show="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    Eliminar
                </button>
            </div>
        </div>
    </div>

</div>

@push('scripts')
<script>
function conferencesPage() {
    return {
        conferences: [],
        loading: true,
        deleting: false,
        deleteTarget: null,
        alert: { msg: '', type: '' },

        async loadData() {
            this.loading = true;
            try {
                this.conferences = await api.get('/api/dashboard/conferences');
            } catch (e) {
                this.showAlert('Error al cargar conferencias', 'error');
            } finally {
                this.loading = false;
            }
        },
        confirmDelete(conf) {
            this.deleteTarget = conf;
        },
        async doDelete() {
            if (!this.deleteTarget) return;
            this.deleting = true;
            try {
                await api.delete('/api/dashboard/conferences/' + this.deleteTarget.id);
                this.conferences = this.conferences.filter(c => c.id !== this.deleteTarget.id);
                this.showAlert('Conferencia eliminada', 'success');
                this.deleteTarget = null;
            } catch (e) {
                this.showAlert('Error al eliminar la conferencia', 'error');
            } finally {
                this.deleting = false;
            }
        },
        formatDate(d) {
            if (!d) return '—';
            return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        },
        isDeadlineSoon(d) {
            if (!d) return false;
            const diff = (new Date(d) - new Date()) / 86400000;
            return diff >= 0 && diff <= 14;
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
