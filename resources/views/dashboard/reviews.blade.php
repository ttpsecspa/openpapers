@extends('layouts.dashboard')
@section('title', 'Mis Revisiones - OpenPapers')

@section('content')
<div x-data="reviewsPage()" x-init="loadData()">
    <h1 class="text-2xl font-heading font-bold text-text-primary mb-6">Mis Revisiones</h1>

    {{-- Tabs --}}
    <div class="flex gap-1 mb-6 bg-bg-secondary rounded-lg p-1 w-fit">
        <button @click="tab = 'pending'; loadData()" :class="tab === 'pending' ? 'bg-bg-card text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'" class="px-4 py-2 rounded-md text-sm font-medium transition">
            Pendientes <span x-show="pendingCount > 0" class="ml-1 px-1.5 py-0.5 bg-yellow-900/30 text-yellow-400 rounded-full text-xs" x-text="pendingCount"></span>
        </button>
        <button @click="tab = 'completed'; loadData()" :class="tab === 'completed' ? 'bg-bg-card text-accent shadow-sm' : 'text-text-muted hover:text-text-primary'" class="px-4 py-2 rounded-md text-sm font-medium transition">
            Completadas <span x-show="completedCount > 0" class="ml-1 px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded-full text-xs" x-text="completedCount"></span>
        </button>
    </div>

    {{-- Reviews list --}}
    <div class="space-y-3">
        <template x-for="review in filteredReviews" :key="review.id">
            <div class="bg-bg-card border border-border-primary rounded-xl p-5 hover:border-accent/30 transition">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-text-primary font-medium truncate" x-text="review.submission?.title || 'Sin título'"></h3>
                        <div class="flex flex-wrap gap-3 mt-2 text-sm text-text-muted">
                            <span x-text="review.submission?.conference?.name || '-'"></span>
                            <span>&middot;</span>
                            <span>Track: <span x-text="review.submission?.track?.name || '-'"></span></span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <template x-if="review.status === 'pending'">
                            <div class="text-right">
                                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-900/30 text-yellow-400">Pendiente</span>
                                <p x-show="review.deadline" class="text-xs mt-1" :class="isOverdue(review.deadline) ? 'text-red-400' : 'text-text-muted'">
                                    Fecha límite: <span x-text="formatDate(review.deadline)"></span>
                                </p>
                            </div>
                        </template>
                        <template x-if="review.status === 'completed'">
                            <div class="text-right">
                                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-green-900/30 text-green-400">Completada</span>
                                <p class="text-xs text-text-muted mt-1">Score: <span class="font-semibold text-text-primary" x-text="review.overall_score"></span>/10</p>
                            </div>
                        </template>
                        <template x-if="review.status === 'declined'">
                            <span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-900/30 text-red-400">Declinada</span>
                        </template>
                    </div>
                </div>
                <div class="mt-3 flex gap-2">
                    <template x-if="review.status === 'pending'">
                        <a :href="'/dashboard/reviews/' + review.id + '/form'" class="px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent/80 transition">Realizar revisión</a>
                    </template>
                    <template x-if="review.status === 'completed'">
                        <a :href="'/dashboard/reviews/' + review.id + '/form'" class="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-sm hover:bg-bg-hover transition">Ver revisión</a>
                    </template>
                    <a :href="'/dashboard/submissions/' + review.submission_id" class="px-3 py-1.5 bg-bg-secondary text-text-secondary rounded-lg text-sm hover:bg-bg-hover transition">Ver envío</a>
                </div>
            </div>
        </template>
        <div x-show="filteredReviews.length === 0" class="bg-bg-card border border-border-primary rounded-xl p-8 text-center text-text-muted">
            <p x-text="tab === 'pending' ? 'No tienes revisiones pendientes' : 'No tienes revisiones completadas'"></p>
        </div>
    </div>
</div>

@push('scripts')
<script>
function reviewsPage() {
    return {
        tab: 'pending',
        reviews: [],
        pendingCount: 0,
        completedCount: 0,
        get filteredReviews() {
            return this.reviews.filter(r => this.tab === 'pending' ? r.status === 'pending' : r.status === 'completed');
        },
        async loadData() {
            try {
                const res = await api.get('/api/dashboard/reviews/my');
                this.reviews = res.data || res;
                this.pendingCount = this.reviews.filter(r => r.status === 'pending').length;
                this.completedCount = this.reviews.filter(r => r.status === 'completed').length;
            } catch (e) { console.error(e); }
        },
        isOverdue(deadline) {
            if (!deadline) return false;
            return new Date(deadline) < new Date();
        }
    };
}
</script>
@endpush
@endsection
