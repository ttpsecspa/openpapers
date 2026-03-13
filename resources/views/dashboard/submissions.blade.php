@extends('layouts.dashboard')
@section('title', 'Envíos - OpenPapers')

@section('content')
<div x-data="submissionsPage()" x-init="loadData()" @conference-changed.window="loadData()">
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary">Envíos</h1>
    </div>

    {{-- Filters --}}
    <div class="flex flex-wrap gap-3 mb-6">
        <select x-model="filters.status" @change="loadData()" class="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm">
            <option value="">Todos los estados</option>
            <option value="submitted">Enviado</option>
            <option value="under_review">En revisión</option>
            <option value="accepted">Aceptado</option>
            <option value="rejected">Rechazado</option>
            <option value="revision_requested">Rev. solicitada</option>
        </select>
        <input x-model="filters.search" @input.debounce.300ms="loadData()" placeholder="Buscar título o código..." class="bg-bg-card border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm w-64">
    </div>

    {{-- Table --}}
    <div class="bg-bg-card border border-border-primary rounded-xl overflow-hidden">
        <table class="w-full text-sm">
            <thead class="bg-bg-secondary border-b border-border-primary">
                <tr>
                    <th class="text-left px-4 py-3 text-text-muted font-medium">Código</th>
                    <th class="text-left px-4 py-3 text-text-muted font-medium">Título</th>
                    <th class="text-left px-4 py-3 text-text-muted font-medium">Track</th>
                    <th class="text-left px-4 py-3 text-text-muted font-medium">Estado</th>
                    <th class="text-left px-4 py-3 text-text-muted font-medium">Fecha</th>
                </tr>
            </thead>
            <tbody>
                <template x-for="sub in submissions" :key="sub.id">
                    <tr class="border-b border-border-primary hover:bg-bg-hover transition cursor-pointer" @click="window.location = '/dashboard/submissions/' + sub.id">
                        <td class="px-4 py-3 font-mono text-accent text-xs" x-text="sub.tracking_code"></td>
                        <td class="px-4 py-3 text-text-primary" x-text="sub.title"></td>
                        <td class="px-4 py-3 text-text-secondary" x-text="sub.track?.name || '-'"></td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded-full text-xs font-semibold" :class="statusClass(sub.status)" x-text="statusLabel(sub.status)"></span>
                        </td>
                        <td class="px-4 py-3 text-text-muted" x-text="formatDate(sub.created_at)"></td>
                    </tr>
                </template>
            </tbody>
        </table>
        <div x-show="submissions.length === 0" class="p-8 text-center text-text-muted">No hay envíos</div>
    </div>

    {{-- Pagination --}}
    <div x-show="pagination.last_page > 1" class="flex justify-center gap-2 mt-4">
        <button @click="page--; loadData()" :disabled="page <= 1" class="px-3 py-1 bg-bg-card border border-border-primary rounded text-text-secondary disabled:opacity-50">Anterior</button>
        <span class="px-3 py-1 text-text-muted" x-text="'Página ' + page + ' de ' + pagination.last_page"></span>
        <button @click="page++; loadData()" :disabled="page >= pagination.last_page" class="px-3 py-1 bg-bg-card border border-border-primary rounded text-text-secondary disabled:opacity-50">Siguiente</button>
    </div>
</div>

@push('scripts')
<script>
function submissionsPage() {
    return {
        submissions: [], pagination: {}, page: 1,
        filters: { status: '', search: '' },
        async loadData() {
            const confId = localStorage.getItem('activeConferenceId');
            let url = '/api/dashboard/submissions?page=' + this.page;
            if (confId) url += '&conference_id=' + confId;
            if (this.filters.status) url += '&status=' + this.filters.status;
            if (this.filters.search) url += '&search=' + encodeURIComponent(this.filters.search);
            try {
                const res = await api.get(url);
                this.submissions = res.data;
                this.pagination = { last_page: res.last_page, total: res.total };
            } catch (e) { console.error(e); }
        },
        statusClass(s) {
            const m = { submitted:'bg-blue-900/30 text-blue-400', under_review:'bg-yellow-900/30 text-yellow-400', accepted:'bg-green-900/30 text-green-400', rejected:'bg-red-900/30 text-red-400', revision_requested:'bg-orange-900/30 text-orange-400', withdrawn:'bg-gray-900/30 text-gray-400', camera_ready:'bg-purple-900/30 text-purple-400' };
            return m[s] || '';
        },
        statusLabel(s) {
            const m = { submitted:'Enviado', under_review:'En revisión', accepted:'Aceptado', rejected:'Rechazado', revision_requested:'Rev. solicitada', withdrawn:'Retirado', camera_ready:'Camera-ready' };
            return m[s] || s;
        }
    };
}
</script>
@endpush
@endsection
