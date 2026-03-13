@extends('layouts.dashboard')
@section('title', 'Panel General - OpenPapers')

@section('content')
<div x-data="overviewPage()" x-init="loadStats()" @conference-changed.window="loadStats()">
    <h1 class="text-2xl font-heading font-bold text-text-primary mb-6">Panel General</h1>

    {{-- Stats cards --}}
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-bg-card border border-border-primary rounded-xl p-4">
            <p class="text-text-muted text-sm">Total Envíos</p>
            <p class="text-3xl font-heading font-bold text-text-primary" x-text="stats.submissions?.total ?? 0"></p>
        </div>
        <div class="bg-bg-card border border-border-primary rounded-xl p-4">
            <p class="text-text-muted text-sm">Revisiones</p>
            <p class="text-3xl font-heading font-bold text-accent" x-text="stats.reviews?.total ?? 0"></p>
        </div>
        <div class="bg-bg-card border border-border-primary rounded-xl p-4">
            <p class="text-text-muted text-sm">Pendientes</p>
            <p class="text-3xl font-heading font-bold text-yellow-400" x-text="stats.reviews?.pending ?? 0"></p>
        </div>
        <div class="bg-bg-card border border-border-primary rounded-xl p-4">
            <p class="text-text-muted text-sm">Score Promedio</p>
            <p class="text-3xl font-heading font-bold text-text-primary" x-text="stats.reviews?.avg_score ?? '-'"></p>
        </div>
    </div>

    {{-- By status --}}
    <div class="grid lg:grid-cols-2 gap-6">
        <div class="bg-bg-card border border-border-primary rounded-xl p-6">
            <h2 class="text-lg font-heading font-semibold text-text-primary mb-4">Envíos por Estado</h2>
            <div class="space-y-2">
                <template x-for="(count, status) in (stats.submissions?.by_status ?? {})" :key="status">
                    <div class="flex items-center justify-between p-2 bg-bg-secondary rounded-lg">
                        <span class="text-text-secondary text-sm capitalize" x-text="statusLabel(status)"></span>
                        <span class="text-text-primary font-semibold" x-text="count"></span>
                    </div>
                </template>
            </div>
        </div>

        <div class="bg-bg-card border border-border-primary rounded-xl p-6">
            <h2 class="text-lg font-heading font-semibold text-text-primary mb-4">Distribución de Scores</h2>
            <div class="space-y-2">
                <template x-for="(count, range) in (stats.reviews?.score_distribution ?? {})" :key="range">
                    <div class="flex items-center gap-3">
                        <span class="text-text-muted text-sm w-12" x-text="range"></span>
                        <div class="flex-1 bg-bg-secondary rounded-full h-6 overflow-hidden">
                            <div class="bg-accent h-full rounded-full transition-all" :style="'width:' + (stats.reviews?.total ? (count/stats.reviews.total*100) : 0) + '%'"></div>
                        </div>
                        <span class="text-text-primary text-sm w-8 text-right" x-text="count"></span>
                    </div>
                </template>
            </div>
        </div>
    </div>

    {{-- Timeline --}}
    <div x-show="stats.timeline" class="mt-6 bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 class="text-lg font-heading font-semibold text-text-primary mb-2">Deadline</h2>
        <p class="text-text-secondary">
            <span x-text="formatDate(stats.timeline?.submission_deadline)"></span>
            <span class="ml-2" :class="stats.timeline?.days_to_deadline > 0 ? 'text-accent' : 'text-red-400'">
                (<span x-text="Math.abs(stats.timeline?.days_to_deadline ?? 0)"></span> días <span x-text="(stats.timeline?.days_to_deadline ?? 0) > 0 ? 'restantes' : 'pasados'"></span>)
            </span>
        </p>
    </div>
</div>

@push('scripts')
<script>
function overviewPage() {
    return {
        stats: {},
        async loadStats() {
            const confId = localStorage.getItem('activeConferenceId');
            const url = '/api/dashboard/stats' + (confId ? '?conference_id=' + confId : '');
            try {
                this.stats = await api.get(url);
            } catch (e) { console.error(e); }
        },
        statusLabel(s) {
            const map = { submitted:'Enviado', under_review:'En revisión', accepted:'Aceptado', rejected:'Rechazado', revision_requested:'Rev. solicitada', withdrawn:'Retirado', camera_ready:'Camera-ready' };
            return map[s] || s;
        }
    };
}
</script>
@endpush
@endsection
