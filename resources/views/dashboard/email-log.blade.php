@extends('layouts.dashboard')
@section('title', 'Email Log - OpenPapers')

@section('content')
<div x-data="emailLogPage()" x-init="loadData()" @conference-changed.window="loadData()">

    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary">Email Log</h1>
        <span class="text-text-muted text-sm" x-text="'Total: ' + (pagination.total ?? 0) + ' registros'"></span>
    </div>

    {{-- Filters --}}
    <div class="flex flex-wrap gap-3 mb-6">
        <select x-model="filters.status" @change="page = 1; loadData()" class="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm">
            <option value="">Todos los estados</option>
            <option value="sent">Enviado</option>
            <option value="failed">Fallido</option>
            <option value="pending">Pendiente</option>
        </select>
        <select x-model="filters.template" @change="page = 1; loadData()" class="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm">
            <option value="">Todas las plantillas</option>
            <option value="submission_received">Confirmación de envío</option>
            <option value="review_invitation">Invitación a revisar</option>
            <option value="decision_accepted">Decisión: Aceptado</option>
            <option value="decision_rejected">Decisión: Rechazado</option>
            <option value="revision_requested">Revisión solicitada</option>
        </select>
        <button @click="filters.status = ''; filters.template = ''; page = 1; loadData()" class="px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-text-muted hover:text-text-primary text-sm transition">
            Limpiar filtros
        </button>
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
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Fecha</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Destinatario</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Asunto</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium hidden md:table-cell">Plantilla</th>
                        <th class="text-left px-4 py-3 text-text-muted font-medium">Estado</th>
                        <th class="text-right px-4 py-3 text-text-muted font-medium">Detalle</th>
                    </tr>
                </thead>
                <tbody>
                    <template x-for="entry in logs" :key="entry.id">
                        <tr class="border-b border-border-primary hover:bg-bg-hover transition">
                            <td class="px-4 py-3 text-text-muted whitespace-nowrap" x-text="formatDate(entry.sent_at)"></td>
                            <td class="px-4 py-3">
                                <span class="text-text-secondary" x-text="entry.recipient_email"></span>
                                <p x-show="entry.recipient_name" class="text-xs text-text-muted" x-text="entry.recipient_name"></p>
                            </td>
                            <td class="px-4 py-3 text-text-primary max-w-xs">
                                <span class="line-clamp-2" x-text="entry.subject || '—'"></span>
                            </td>
                            <td class="px-4 py-3 text-text-muted hidden md:table-cell" x-text="templateLabel(entry.template)"></td>
                            <td class="px-4 py-3">
                                <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="statusClass(entry.status)" x-text="statusLabel(entry.status)"></span>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button x-show="entry.error_message" @click="showError(entry)" class="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-900/20 rounded-lg transition" title="Ver error">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                </button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            <div x-show="logs.length === 0 && !loading" class="p-10 text-center text-text-muted">
                No hay registros de email con los filtros aplicados
            </div>
        </div>
    </div>

    {{-- Pagination --}}
    <div x-show="pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-4">
        <button @click="page--; loadData()" :disabled="page <= 1" class="px-3 py-1.5 bg-bg-card border border-border-primary rounded-lg text-text-secondary disabled:opacity-50 text-sm transition hover:bg-bg-hover">
            Anterior
        </button>
        <span class="px-3 py-1.5 text-text-muted text-sm" x-text="'Página ' + page + ' de ' + pagination.last_page"></span>
        <button @click="page++; loadData()" :disabled="page >= pagination.last_page" class="px-3 py-1.5 bg-bg-card border border-border-primary rounded-lg text-text-secondary disabled:opacity-50 text-sm transition hover:bg-bg-hover">
            Siguiente
        </button>
    </div>

    {{-- Error detail modal --}}
    <div x-show="errorModal.show" x-transition.opacity class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @keydown.escape.window="errorModal.show = false">
        <div @click.stop class="bg-bg-card border border-border-primary rounded-2xl w-full max-w-lg shadow-2xl" x-transition.scale>
            <div class="flex items-center justify-between p-5 border-b border-border-primary">
                <h3 class="text-lg font-heading font-semibold text-red-400">Error de envío</h3>
                <button @click="errorModal.show = false" class="text-text-muted hover:text-text-primary transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="p-5">
                <p class="text-text-muted text-xs mb-2">Destinatario: <span class="text-text-secondary" x-text="errorModal.entry?.recipient_email"></span></p>
                <p class="text-text-muted text-xs mb-4">Fecha: <span class="text-text-secondary" x-text="formatDate(errorModal.entry?.sent_at)"></span></p>
                <pre class="bg-bg-secondary rounded-lg p-4 text-red-400 text-xs overflow-auto max-h-48 whitespace-pre-wrap" x-text="errorModal.entry?.error_message"></pre>
            </div>
            <div class="p-5 border-t border-border-primary flex justify-end">
                <button @click="errorModal.show = false" class="px-4 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-secondary hover:bg-bg-hover text-sm transition">Cerrar</button>
            </div>
        </div>
    </div>

</div>

@push('scripts')
<script>
function emailLogPage() {
    return {
        logs: [],
        loading: true,
        page: 1,
        pagination: {},
        filters: { status: '', template: '' },
        errorModal: { show: false, entry: null },

        async loadData() {
            this.loading = true;
            try {
                const confId = localStorage.getItem('activeConferenceId');
                let url = '/api/dashboard/email-log?page=' + this.page;
                if (confId)              url += '&conference_id=' + confId;
                if (this.filters.status)   url += '&status='   + this.filters.status;
                if (this.filters.template) url += '&template=' + this.filters.template;

                const res = await api.get(url);
                this.logs = res.data ?? res;
                this.pagination = { last_page: res.last_page ?? 1, total: res.total ?? 0 };
            } catch (e) {
                console.error(e);
            } finally {
                this.loading = false;
            }
        },
        showError(entry) {
            this.errorModal = { show: true, entry };
        },
        formatDate(d) {
            if (!d) return '—';
            return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        },
        statusLabel(s) {
            return { sent: 'Enviado', failed: 'Fallido', pending: 'Pendiente' }[s] || s;
        },
        statusClass(s) {
            return {
                sent:    'bg-green-900/30 text-green-400',
                failed:  'bg-red-900/30 text-red-400',
                pending: 'bg-yellow-900/30 text-yellow-400',
            }[s] || 'bg-gray-900/30 text-gray-400';
        },
        templateLabel(t) {
            const m = {
                submission_received:  'Confirmación de envío',
                review_invitation:    'Invitación a revisar',
                decision_accepted:    'Decisión: Aceptado',
                decision_rejected:    'Decisión: Rechazado',
                revision_requested:   'Revisión solicitada',
            };
            return m[t] || (t || '—');
        },
    };
}
</script>
@endpush
@endsection
