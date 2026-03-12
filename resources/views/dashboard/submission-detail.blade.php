@extends('layouts.dashboard')
@section('title', 'Detalle de Envío - OpenPapers')

@section('content')
<div x-data="submissionDetail()" x-init="loadData()" class="max-w-5xl">
    {{-- Back link --}}
    <a href="{{ route('dashboard.submissions') }}" class="inline-flex items-center gap-2 text-text-muted hover:text-accent transition mb-4">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a envíos
    </a>

    {{-- Header --}}
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
            <h1 class="text-2xl font-heading font-bold text-text-primary" x-text="submission.title || 'Cargando...'"></h1>
            <p class="text-text-muted text-sm mt-1">
                Código: <span class="font-mono text-accent" x-text="submission.tracking_code"></span>
            </p>
        </div>
        <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full text-xs font-semibold" :class="statusClass(submission.status)" x-text="statusLabel(submission.status)"></span>
            @if(auth()->user()->isAdmin())
            <button @click="showStatusModal = true" class="px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-sm hover:bg-accent/20 transition">Cambiar estado</button>
            @endif
        </div>
    </div>

    {{-- Info cards --}}
    <div class="grid lg:grid-cols-3 gap-6 mb-6">
        <div class="lg:col-span-2 space-y-6">
            {{-- Abstract --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <h2 class="text-lg font-heading font-semibold text-text-primary mb-3">Resumen</h2>
                <p class="text-text-secondary leading-relaxed whitespace-pre-line" x-text="submission.abstract || 'Sin resumen'"></p>
            </div>

            {{-- Reviews --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-heading font-semibold text-text-primary">Revisiones</h2>
                    @if(auth()->user()->isAdmin())
                    <button @click="showAssignModal = true" class="px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent/80 transition">Asignar revisor</button>
                    @endif
                </div>
                <div x-show="reviews.length === 0" class="text-text-muted text-sm py-4">No hay revisiones aún.</div>
                <div class="space-y-4">
                    <template x-for="review in reviews" :key="review.id">
                        <div class="border border-border-primary rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-text-secondary text-sm" x-text="review.reviewer?.full_name || 'Revisor anónimo'"></span>
                                <span class="px-2 py-0.5 rounded-full text-xs font-semibold" :class="review.status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'" x-text="review.status === 'completed' ? 'Completada' : 'Pendiente'"></span>
                            </div>
                            <template x-if="review.status === 'completed'">
                                <div>
                                    <div class="flex flex-wrap gap-4 mb-3">
                                        <div class="text-center">
                                            <p class="text-xs text-text-muted">Score</p>
                                            <p class="text-xl font-bold" :class="review.overall_score >= 7 ? 'text-green-400' : review.overall_score >= 4 ? 'text-yellow-400' : 'text-red-400'" x-text="review.overall_score"></p>
                                        </div>
                                        <div class="text-center" x-show="review.originality_score">
                                            <p class="text-xs text-text-muted">Originalidad</p>
                                            <p class="text-sm font-semibold text-text-primary" x-text="review.originality_score"></p>
                                        </div>
                                        <div class="text-center" x-show="review.technical_score">
                                            <p class="text-xs text-text-muted">Técnico</p>
                                            <p class="text-sm font-semibold text-text-primary" x-text="review.technical_score"></p>
                                        </div>
                                        <div class="text-center" x-show="review.clarity_score">
                                            <p class="text-xs text-text-muted">Claridad</p>
                                            <p class="text-sm font-semibold text-text-primary" x-text="review.clarity_score"></p>
                                        </div>
                                        <div class="text-center" x-show="review.relevance_score">
                                            <p class="text-xs text-text-muted">Relevancia</p>
                                            <p class="text-sm font-semibold text-text-primary" x-text="review.relevance_score"></p>
                                        </div>
                                    </div>
                                    <div x-show="review.recommendation" class="mb-2">
                                        <span class="text-xs text-text-muted">Recomendación:</span>
                                        <span class="text-sm text-text-secondary ml-1" x-text="recommendationLabel(review.recommendation)"></span>
                                    </div>
                                    <div x-show="review.comments_to_authors" class="mt-3 p-3 bg-bg-secondary rounded-lg">
                                        <p class="text-xs text-text-muted mb-1">Comentarios para autores</p>
                                        <p class="text-text-secondary text-sm whitespace-pre-line" x-text="review.comments_to_authors"></p>
                                    </div>
                                    @if(auth()->user()->isAdmin())
                                    <div x-show="review.comments_to_chairs" class="mt-2 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg">
                                        <p class="text-xs text-yellow-400 mb-1">Comentarios para chairs (privado)</p>
                                        <p class="text-text-secondary text-sm whitespace-pre-line" x-text="review.comments_to_chairs"></p>
                                    </div>
                                    @endif
                                </div>
                            </template>
                        </div>
                    </template>
                </div>
            </div>
        </div>

        {{-- Sidebar --}}
        <div class="space-y-6">
            {{-- Metadata --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Información</h3>
                <dl class="space-y-3 text-sm">
                    <div>
                        <dt class="text-text-muted">Conferencia</dt>
                        <dd class="text-text-primary" x-text="submission.conference?.name || '-'"></dd>
                    </div>
                    <div>
                        <dt class="text-text-muted">Track</dt>
                        <dd class="text-text-primary" x-text="submission.track?.name || '-'"></dd>
                    </div>
                    @if(auth()->user()->isAdmin())
                    <div>
                        <dt class="text-text-muted">Autores</dt>
                        <dd class="text-text-primary">
                            <template x-for="author in (submission.authors || [])" :key="author.id || author.email">
                                <span class="block" x-text="author.full_name || author.email"></span>
                            </template>
                        </dd>
                    </div>
                    @endif
                    <div>
                        <dt class="text-text-muted">Enviado</dt>
                        <dd class="text-text-primary" x-text="formatDate(submission.created_at)"></dd>
                    </div>
                    <div>
                        <dt class="text-text-muted">Actualizado</dt>
                        <dd class="text-text-primary" x-text="formatDate(submission.updated_at)"></dd>
                    </div>
                </dl>
            </div>

            {{-- File --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <h3 class="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Archivo</h3>
                <template x-if="submission.file_path">
                    <a :href="'/api/dashboard/submissions/' + submission.id + '/download'" class="flex items-center gap-2 text-accent hover:underline text-sm">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Descargar PDF
                    </a>
                </template>
                <template x-if="!submission.file_path">
                    <p class="text-text-muted text-sm">Sin archivo</p>
                </template>
            </div>
        </div>
    </div>

    {{-- Change Status Modal --}}
    @if(auth()->user()->isAdmin())
    <div x-show="showStatusModal" x-transition.opacity class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click.self="showStatusModal = false" style="display:none;">
        <div class="bg-bg-card border border-border-primary rounded-xl p-6 w-full max-w-md" @click.stop>
            <h3 class="text-lg font-heading font-semibold text-text-primary mb-4">Cambiar Estado</h3>
            <select x-model="newStatus" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm mb-4">
                <option value="submitted">Enviado</option>
                <option value="under_review">En revisión</option>
                <option value="accepted">Aceptado</option>
                <option value="rejected">Rechazado</option>
                <option value="revision_requested">Revisión solicitada</option>
                <option value="camera_ready">Camera-ready</option>
                <option value="withdrawn">Retirado</option>
            </select>
            <div class="flex justify-end gap-3">
                <button @click="showStatusModal = false" class="px-4 py-2 text-text-secondary hover:text-text-primary transition text-sm">Cancelar</button>
                <button @click="changeStatus()" :disabled="saving" class="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/80 transition disabled:opacity-50">Guardar</button>
            </div>
        </div>
    </div>

    {{-- Assign Reviewer Modal --}}
    <div x-show="showAssignModal" x-transition.opacity class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" @click.self="showAssignModal = false" style="display:none;">
        <div class="bg-bg-card border border-border-primary rounded-xl p-6 w-full max-w-md" @click.stop>
            <h3 class="text-lg font-heading font-semibold text-text-primary mb-4">Asignar Revisor</h3>
            <div class="mb-4">
                <input x-model="reviewerSearch" @input.debounce.300ms="searchReviewers()" placeholder="Buscar revisor por nombre o email..." class="w-full bg-bg-secondary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm">
            </div>
            <div class="max-h-48 overflow-y-auto space-y-1 mb-4">
                <template x-for="user in availableReviewers" :key="user.id">
                    <button @click="assignReviewer(user.id)" class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-bg-hover transition text-left">
                        <div class="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold" x-text="(user.full_name || user.email).charAt(0).toUpperCase()"></div>
                        <div>
                            <p class="text-text-primary text-sm" x-text="user.full_name || user.email"></p>
                            <p class="text-text-muted text-xs" x-text="user.email"></p>
                        </div>
                    </button>
                </template>
                <div x-show="availableReviewers.length === 0 && reviewerSearch.length >= 2" class="text-text-muted text-sm py-2 text-center">No se encontraron revisores</div>
            </div>
            <div class="flex justify-end">
                <button @click="showAssignModal = false" class="px-4 py-2 text-text-secondary hover:text-text-primary transition text-sm">Cerrar</button>
            </div>
        </div>
    </div>
    @endif
</div>

@push('scripts')
<script>
function submissionDetail() {
    return {
        submission: {},
        reviews: [],
        showStatusModal: false,
        showAssignModal: false,
        newStatus: '',
        saving: false,
        reviewerSearch: '',
        availableReviewers: [],
        async loadData() {
            try {
                const data = await api.get('/api/dashboard/submissions/{{ $id }}');
                this.submission = data.submission || data;
                this.reviews = data.reviews || this.submission.reviews || [];
                this.newStatus = this.submission.status;
            } catch (e) { console.error(e); }
        },
        async changeStatus() {
            this.saving = true;
            try {
                await api.put('/api/dashboard/submissions/{{ $id }}/status', { status: this.newStatus });
                this.submission.status = this.newStatus;
                this.showStatusModal = false;
            } catch (e) { alert('Error al cambiar estado'); console.error(e); }
            this.saving = false;
        },
        async searchReviewers() {
            if (this.reviewerSearch.length < 2) { this.availableReviewers = []; return; }
            try {
                const res = await api.get('/api/dashboard/users?role=reviewer&search=' + encodeURIComponent(this.reviewerSearch));
                this.availableReviewers = res.data || res;
            } catch (e) { console.error(e); }
        },
        async assignReviewer(userId) {
            try {
                await api.post('/api/dashboard/reviews', { submission_id: {{ $id }}, reviewer_id: userId });
                this.showAssignModal = false;
                this.reviewerSearch = '';
                this.availableReviewers = [];
                this.loadData();
            } catch (e) { alert('Error al asignar revisor'); console.error(e); }
        },
        statusClass(s) {
            const m = { submitted:'bg-blue-900/30 text-blue-400', under_review:'bg-yellow-900/30 text-yellow-400', accepted:'bg-green-900/30 text-green-400', rejected:'bg-red-900/30 text-red-400', revision_requested:'bg-orange-900/30 text-orange-400', withdrawn:'bg-gray-900/30 text-gray-400', camera_ready:'bg-purple-900/30 text-purple-400' };
            return m[s] || '';
        },
        statusLabel(s) {
            const m = { submitted:'Enviado', under_review:'En revisión', accepted:'Aceptado', rejected:'Rechazado', revision_requested:'Rev. solicitada', withdrawn:'Retirado', camera_ready:'Camera-ready' };
            return m[s] || s;
        },
        recommendationLabel(r) {
            const m = { strong_accept:'Aceptar (fuerte)', accept:'Aceptar', weak_accept:'Aceptar (débil)', borderline:'Borderline', weak_reject:'Rechazar (débil)', reject:'Rechazar', strong_reject:'Rechazar (fuerte)' };
            return m[r] || r;
        }
    };
}
</script>
@endpush
@endsection
