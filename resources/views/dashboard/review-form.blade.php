@extends('layouts.dashboard')
@section('title', 'Revisión - OpenPapers')

@section('content')
<div x-data="reviewFormPage({{ $submissionId }})" x-init="loadData()">

    {{-- Back link --}}
    <a href="{{ route('dashboard.reviews') }}" class="inline-flex items-center gap-2 text-text-muted hover:text-text-primary text-sm mb-6 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Volver a mis revisiones
    </a>

    {{-- Loading --}}
    <div x-show="loading" class="flex items-center justify-center py-16 text-text-muted">
        <svg class="animate-spin w-6 h-6 mr-3 text-accent" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
        Cargando…
    </div>

    <div x-show="!loading">
        {{-- Submission summary --}}
        <div class="bg-bg-card border border-border-primary rounded-xl p-5 mb-6" x-show="submission">
            <h1 class="text-xl font-heading font-bold text-text-primary mb-1" x-text="submission?.title"></h1>
            <div class="flex flex-wrap gap-4 text-sm text-text-muted">
                <span>Código: <span class="font-mono text-accent" x-text="submission?.tracking_code"></span></span>
                <span x-show="submission?.track?.name">Track: <span class="text-text-secondary" x-text="submission?.track?.name"></span></span>
                <span>Estado: <span class="text-text-secondary capitalize" x-text="submission?.status"></span></span>
            </div>
        </div>

        {{-- Alert --}}
        <div x-show="alert.msg" x-transition class="mb-6 px-4 py-3 rounded-lg text-sm font-medium" :class="alert.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'" x-text="alert.msg"></div>

        {{-- Review form --}}
        <form @submit.prevent="submitReview()" class="space-y-6">
            {{-- Score sliders --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <h2 class="text-lg font-heading font-semibold text-text-primary mb-5">Puntuaciones (1 – 10)</h2>
                <div class="space-y-5">
                    {{-- overall_score --}}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-sm font-medium text-text-secondary">Score General <span class="text-red-400">*</span></label>
                            <span class="text-accent font-semibold text-sm w-6 text-right" x-text="form.overall_score"></span>
                        </div>
                        <input type="range" min="1" max="10" step="1" x-model.number="form.overall_score" class="w-full accent-indigo-500 cursor-pointer h-2 rounded-full bg-bg-secondary appearance-none">
                        <div class="flex justify-between text-xs text-text-muted mt-1"><span>1</span><span>10</span></div>
                    </div>

                    {{-- originality_score --}}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-sm font-medium text-text-secondary">Originalidad</label>
                            <span class="text-accent font-semibold text-sm w-6 text-right" x-text="form.originality_score"></span>
                        </div>
                        <input type="range" min="1" max="10" step="1" x-model.number="form.originality_score" class="w-full accent-indigo-500 cursor-pointer h-2 rounded-full bg-bg-secondary appearance-none">
                        <div class="flex justify-between text-xs text-text-muted mt-1"><span>1</span><span>10</span></div>
                    </div>

                    {{-- technical_score --}}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-sm font-medium text-text-secondary">Rigor Técnico</label>
                            <span class="text-accent font-semibold text-sm w-6 text-right" x-text="form.technical_score"></span>
                        </div>
                        <input type="range" min="1" max="10" step="1" x-model.number="form.technical_score" class="w-full accent-indigo-500 cursor-pointer h-2 rounded-full bg-bg-secondary appearance-none">
                        <div class="flex justify-between text-xs text-text-muted mt-1"><span>1</span><span>10</span></div>
                    </div>

                    {{-- clarity_score --}}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-sm font-medium text-text-secondary">Claridad y Presentación</label>
                            <span class="text-accent font-semibold text-sm w-6 text-right" x-text="form.clarity_score"></span>
                        </div>
                        <input type="range" min="1" max="10" step="1" x-model.number="form.clarity_score" class="w-full accent-indigo-500 cursor-pointer h-2 rounded-full bg-bg-secondary appearance-none">
                        <div class="flex justify-between text-xs text-text-muted mt-1"><span>1</span><span>10</span></div>
                    </div>

                    {{-- relevance_score --}}
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-sm font-medium text-text-secondary">Relevancia</label>
                            <span class="text-accent font-semibold text-sm w-6 text-right" x-text="form.relevance_score"></span>
                        </div>
                        <input type="range" min="1" max="10" step="1" x-model.number="form.relevance_score" class="w-full accent-indigo-500 cursor-pointer h-2 rounded-full bg-bg-secondary appearance-none">
                        <div class="flex justify-between text-xs text-text-muted mt-1"><span>1</span><span>10</span></div>
                    </div>
                </div>

                {{-- Visual score summary --}}
                <div class="mt-5 p-4 bg-bg-secondary rounded-lg flex flex-wrap gap-4 text-sm">
                    <template x-for="item in scoreSummary" :key="item.label">
                        <div class="flex items-center gap-2">
                            <div class="w-2 h-2 rounded-full bg-accent opacity-70"></div>
                            <span class="text-text-muted" x-text="item.label + ':'"></span>
                            <span class="font-semibold text-text-primary" x-text="item.value + '/10'"></span>
                        </div>
                    </template>
                </div>
            </div>

            {{-- Confidence --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <h2 class="text-lg font-heading font-semibold text-text-primary mb-4">Confianza del Revisor</h2>
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="text-sm font-medium text-text-secondary">Nivel de confianza (1 – 5)</label>
                        <span class="text-accent font-semibold text-sm" x-text="confidenceLabel(form.confidence)"></span>
                    </div>
                    <input type="range" min="1" max="5" step="1" x-model.number="form.confidence" class="w-full accent-indigo-500 cursor-pointer h-2 rounded-full bg-bg-secondary appearance-none">
                    <div class="flex justify-between text-xs text-text-muted mt-1">
                        <span>Bajo</span><span>Medio</span><span>Alto</span>
                    </div>
                </div>
            </div>

            {{-- Recommendation --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6">
                <h2 class="text-lg font-heading font-semibold text-text-primary mb-4">Recomendación <span class="text-red-400">*</span></h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <template x-for="opt in recommendationOptions" :key="opt.value">
                        <label :class="form.recommendation === opt.value ? 'border-accent bg-accent/10 text-accent' : 'border-border-primary bg-bg-secondary text-text-secondary hover:border-accent/50'" class="flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition">
                            <input type="radio" :value="opt.value" x-model="form.recommendation" class="sr-only">
                            <div class="w-3 h-3 rounded-full border-2 flex-shrink-0 transition" :class="form.recommendation === opt.value ? 'border-accent bg-accent' : 'border-text-muted'"></div>
                            <span class="text-sm font-medium" x-text="opt.label"></span>
                        </label>
                    </template>
                </div>
            </div>

            {{-- Comments --}}
            <div class="bg-bg-card border border-border-primary rounded-xl p-6 space-y-5">
                <h2 class="text-lg font-heading font-semibold text-text-primary">Comentarios</h2>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-2">
                        Comentarios para los autores <span class="text-red-400">*</span>
                        <span class="text-text-muted font-normal ml-1">(mín. 10 caracteres)</span>
                    </label>
                    <textarea x-model="form.comments_to_authors" rows="6" placeholder="Proporciona retroalimentación constructiva sobre el trabajo..." class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-3 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition resize-y"></textarea>
                    <p class="text-xs text-text-muted mt-1 text-right" x-text="form.comments_to_authors.length + ' caracteres'"></p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-2">
                        Comentarios confidenciales para el comité
                        <span class="text-text-muted font-normal ml-1">(no visibles para los autores)</span>
                    </label>
                    <textarea x-model="form.comments_to_chairs" rows="4" placeholder="Comentarios internos para los chairs del programa..." class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-3 text-text-primary text-sm placeholder-text-muted focus:outline-none focus:border-accent transition resize-y"></textarea>
                </div>
            </div>

            {{-- Actions --}}
            <div class="flex items-center justify-between pt-2">
                <a href="{{ route('dashboard.reviews') }}" class="px-5 py-2.5 bg-bg-card border border-border-primary rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-hover transition text-sm">
                    Cancelar
                </a>
                <button type="submit" :disabled="saving" class="px-6 py-2.5 bg-accent hover:bg-accent/80 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition flex items-center gap-2">
                    <svg x-show="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    <span x-text="isEdit ? 'Actualizar revisión' : 'Enviar revisión'"></span>
                </button>
            </div>
        </form>
    </div>
</div>

@push('scripts')
<script>
function reviewFormPage(submissionId) {
    return {
        submissionId,
        submission: null,
        existingReviewId: null,
        loading: true,
        saving: false,
        isEdit: false,
        alert: { msg: '', type: '' },
        form: {
            overall_score: 5,
            originality_score: 5,
            technical_score: 5,
            clarity_score: 5,
            relevance_score: 5,
            confidence: 3,
            recommendation: '',
            comments_to_authors: '',
            comments_to_chairs: '',
        },
        recommendationOptions: [
            { value: 'strong_accept',  label: 'Aceptar con confianza' },
            { value: 'accept',         label: 'Aceptar' },
            { value: 'weak_accept',    label: 'Aceptar con reservas' },
            { value: 'weak_reject',    label: 'Rechazar con reservas' },
            { value: 'reject',         label: 'Rechazar' },
            { value: 'strong_reject',  label: 'Rechazar con firmeza' },
        ],
        get scoreSummary() {
            return [
                { label: 'General',      value: this.form.overall_score },
                { label: 'Originalidad', value: this.form.originality_score },
                { label: 'Técnico',      value: this.form.technical_score },
                { label: 'Claridad',     value: this.form.clarity_score },
                { label: 'Relevancia',   value: this.form.relevance_score },
            ];
        },
        confidenceLabel(v) {
            const m = { 1: '1 – Muy bajo', 2: '2 – Bajo', 3: '3 – Medio', 4: '4 – Alto', 5: '5 – Experto' };
            return m[v] || v;
        },
        async loadData() {
            try {
                // Load submission detail
                this.submission = await api.get('/api/dashboard/submissions/' + this.submissionId);

                // Check for an existing review on this submission by loading my reviews
                const myReviews = await api.get('/api/dashboard/reviews/my');
                const list = Array.isArray(myReviews) ? myReviews : (myReviews.data || []);
                const existing = list.find(r => r.submission_id == this.submissionId && r.status === 'completed');
                if (existing) {
                    this.isEdit = true;
                    this.existingReviewId = existing.id;
                    // Pre-fill form
                    this.form.overall_score      = existing.overall_score      ?? 5;
                    this.form.originality_score  = existing.originality_score  ?? 5;
                    this.form.technical_score    = existing.technical_score    ?? 5;
                    this.form.clarity_score      = existing.clarity_score      ?? 5;
                    this.form.relevance_score    = existing.relevance_score    ?? 5;
                    this.form.confidence         = existing.confidence         ?? 3;
                    this.form.recommendation     = existing.recommendation     ?? '';
                    this.form.comments_to_authors = existing.comments_to_authors ?? '';
                    this.form.comments_to_chairs  = existing.comments_to_chairs  ?? '';
                }
            } catch (e) {
                console.error(e);
                this.showAlert('Error al cargar los datos', 'error');
            } finally {
                this.loading = false;
            }
        },
        async submitReview() {
            if (!this.form.recommendation) {
                return this.showAlert('Selecciona una recomendación', 'error');
            }
            if (this.form.comments_to_authors.length < 10) {
                return this.showAlert('Los comentarios para los autores deben tener al menos 10 caracteres', 'error');
            }
            this.saving = true;
            try {
                const payload = {
                    ...this.form,
                    submission_id: this.submissionId,
                };
                if (this.isEdit) {
                    await api.put('/api/dashboard/reviews/' + this.existingReviewId, payload);
                    this.showAlert('Revisión actualizada correctamente', 'success');
                } else {
                    await api.post('/api/dashboard/reviews', payload);
                    this.showAlert('Revisión enviada correctamente', 'success');
                    this.isEdit = true;
                    setTimeout(() => window.location = '{{ route("dashboard.reviews") }}', 1500);
                }
            } catch (e) {
                const msg = e?.response?.data?.error || e?.message || 'Error al enviar la revisión';
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
