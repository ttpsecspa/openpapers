@extends('layouts.public')
@section('title', 'Estado de Envío - OpenPapers')

@section('content')
<div class="max-w-2xl mx-auto" x-data="trackPage()">
    <h1 class="text-3xl font-heading font-bold text-text-primary mb-6 text-center">Consultar Estado de Envío</h1>

    <div class="bg-bg-card border border-border-primary rounded-xl p-6 mb-6">
        <form @submit.prevent="search()">
            <label class="block text-sm font-medium text-text-secondary mb-2">Código de Seguimiento</label>
            <div class="flex gap-3">
                <input type="text" x-model="code" placeholder="CFP-CONF-2026-0001" required class="flex-1 bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                <button type="submit" :disabled="loading" class="bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50">
                    <span x-show="!loading">Buscar</span>
                    <span x-show="loading">...</span>
                </button>
            </div>
        </form>
    </div>

    {{-- Error --}}
    <div x-show="error" class="bg-red-900/20 border border-red-800/30 rounded-xl p-4 mb-6">
        <p class="text-red-400" x-text="error"></p>
    </div>

    {{-- Result --}}
    <div x-show="result" class="bg-bg-card border border-border-primary rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-heading font-semibold text-text-primary" x-text="result?.title"></h2>
            <span class="px-3 py-1 rounded-full text-sm font-semibold"
                  :class="statusClass(result?.status)"
                  x-text="statusLabel(result?.status)"></span>
        </div>

        <div class="space-y-2 text-sm text-text-secondary mb-4">
            <p><span class="text-text-muted">Código:</span> <span x-text="result?.tracking_code" class="font-mono text-accent"></span></p>
            <p><span class="text-text-muted">Conferencia:</span> <span x-text="result?.conference"></span></p>
            <p x-show="result?.track"><span class="text-text-muted">Track:</span> <span x-text="result?.track"></span></p>
            <p><span class="text-text-muted">Enviado:</span> <span x-text="result?.submitted_at ? formatDate(result.submitted_at) : ''"></span></p>
        </div>

        {{-- Reviews (only shown when decision made) --}}
        <template x-if="result?.reviews && result.reviews.length > 0">
            <div class="mt-6 space-y-4">
                <h3 class="text-lg font-heading font-semibold text-text-primary">Revisiones</h3>
                <template x-for="(review, i) in result.reviews" :key="i">
                    <div class="bg-bg-secondary border border-border-primary rounded-lg p-4">
                        <div class="flex items-center gap-4 mb-2">
                            <span class="text-accent font-semibold">Score: <span x-text="review.overall_score"></span>/10</span>
                            <span class="text-text-muted" x-text="review.recommendation"></span>
                        </div>
                        <p class="text-text-secondary text-sm whitespace-pre-wrap" x-text="review.comments_to_authors"></p>
                    </div>
                </template>

                <div x-show="result?.decision_notes" class="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-accent mb-1">Notas de decisión</h4>
                    <p class="text-text-secondary text-sm" x-text="result?.decision_notes"></p>
                </div>
            </div>
        </template>
    </div>
</div>

@push('scripts')
<script>
function trackPage() {
    return {
        code: '', result: null, error: null, loading: false,
        async search() {
            this.error = null;
            this.result = null;
            this.loading = true;
            try {
                this.result = await api.get('/api/submissions/track/' + encodeURIComponent(this.code));
            } catch (e) {
                this.error = e.error || 'Código no encontrado';
            } finally {
                this.loading = false;
            }
        },
        statusClass(status) {
            const map = {
                submitted: 'bg-blue-900/30 text-blue-400',
                under_review: 'bg-yellow-900/30 text-yellow-400',
                accepted: 'bg-green-900/30 text-green-400',
                rejected: 'bg-red-900/30 text-red-400',
                revision_requested: 'bg-orange-900/30 text-orange-400',
                withdrawn: 'bg-gray-900/30 text-gray-400',
                camera_ready: 'bg-purple-900/30 text-purple-400',
            };
            return map[status] || 'bg-gray-900/30 text-gray-400';
        },
        statusLabel(status) {
            const map = {
                submitted: 'Enviado', under_review: 'En revisión', accepted: 'Aceptado',
                rejected: 'Rechazado', revision_requested: 'Revisión solicitada',
                withdrawn: 'Retirado', camera_ready: 'Camera-ready',
            };
            return map[status] || status;
        },
    };
}
</script>
@endpush
@endsection
