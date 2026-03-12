@extends('layouts.public')
@section('title', 'Enviar Paper - ' . $conference->name)

@section('content')
<div class="max-w-3xl mx-auto" x-data="submitWizard()">
    <h1 class="text-3xl font-heading font-bold text-text-primary mb-2">Enviar Paper</h1>
    <p class="text-text-secondary mb-6">{{ $conference->name }}</p>

    {{-- Step indicators --}}
    <div class="flex items-center gap-2 mb-8">
        <template x-for="(label, i) in steps" :key="i">
            <div class="flex items-center gap-2">
                <div :class="step >= i ? 'bg-accent text-bg-primary' : 'bg-bg-card text-text-muted border border-border-primary'"
                     class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition" x-text="i + 1"></div>
                <span class="text-sm hidden sm:inline" :class="step >= i ? 'text-text-primary' : 'text-text-muted'" x-text="label"></span>
                <div x-show="i < steps.length - 1" class="w-8 h-px bg-border-primary"></div>
            </div>
        </template>
    </div>

    {{-- Step 0: Authors --}}
    <div x-show="step === 0" class="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Autores</h2>
        <template x-for="(author, i) in authors" :key="i">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 p-3 bg-bg-secondary rounded-lg">
                <input x-model="author.name" placeholder="Nombre completo" required class="bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:border-accent focus:outline-none">
                <input x-model="author.email" type="email" placeholder="Email" required class="bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:border-accent focus:outline-none">
                <div class="flex items-center gap-2">
                    <input x-model="author.affiliation" placeholder="Afiliación" class="flex-1 bg-bg-primary border border-border-primary rounded-lg px-3 py-2 text-text-primary text-sm focus:border-accent focus:outline-none">
                    <button @click="authors.splice(i, 1)" x-show="authors.length > 1" class="text-red-400 hover:text-red-300 p-1">✕</button>
                </div>
            </div>
        </template>
        <button @click="authors.push({name:'',email:'',affiliation:'',isCorresponding:false})" class="text-accent hover:text-accent-hover text-sm font-semibold">+ Agregar autor</button>
    </div>

    {{-- Step 1: Paper info --}}
    <div x-show="step === 1" class="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Información del Paper</h2>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Título</label>
                <input x-model="form.title" required minlength="5" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none">
            </div>
            <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Abstract</label>
                <textarea x-model="form.abstract" required minlength="50" rows="6" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none resize-y"></textarea>
            </div>
            @if($conference->tracks->isNotEmpty())
            <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Track</label>
                <select x-model="form.track_id" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none">
                    <option value="">Seleccionar track</option>
                    @foreach($conference->tracks as $track)
                        <option value="{{ $track->id }}">{{ $track->name }}</option>
                    @endforeach
                </select>
            </div>
            @endif
            <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Palabras clave (opcional)</label>
                <input x-model="form.keywords" placeholder="separadas por coma" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none">
            </div>
        </div>
    </div>

    {{-- Step 2: File upload --}}
    <div x-show="step === 2" class="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Archivo</h2>
        <div class="border-2 border-dashed border-border-primary rounded-xl p-8 text-center hover:border-accent/50 transition"
             @dragover.prevent="$el.classList.add('border-accent')"
             @dragleave="$el.classList.remove('border-accent')"
             @drop.prevent="handleDrop($event)">
            <svg class="w-12 h-12 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
            <p class="text-text-secondary mb-2">Arrastra tu archivo PDF aquí o</p>
            <label class="cursor-pointer text-accent hover:text-accent-hover font-semibold">
                selecciona un archivo
                <input type="file" accept=".pdf" @change="handleFile($event)" class="hidden">
            </label>
            <p class="text-text-muted text-xs mt-2">Solo PDF, máximo {{ $conference->max_file_size_mb }}MB</p>
        </div>
        <div x-show="file" class="mt-4 flex items-center gap-3 p-3 bg-bg-secondary rounded-lg">
            <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="text-text-primary text-sm" x-text="file?.name"></span>
            <button @click="file = null" class="text-red-400 ml-auto text-sm">Eliminar</button>
        </div>
    </div>

    {{-- Step 3: Confirmation --}}
    <div x-show="step === 3" class="bg-bg-card border border-border-primary rounded-xl p-6">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Confirmación</h2>
        <div class="space-y-3 text-sm">
            <p><span class="text-text-muted">Título:</span> <span class="text-text-primary" x-text="form.title"></span></p>
            <p><span class="text-text-muted">Autores:</span> <span class="text-text-primary" x-text="authors.map(a => a.name).join(', ')"></span></p>
            <p><span class="text-text-muted">Email de contacto:</span> <span class="text-text-primary" x-text="authors[0]?.email"></span></p>
            <p><span class="text-text-muted">Archivo:</span> <span class="text-text-primary" x-text="file?.name"></span></p>
        </div>
    </div>

    {{-- Error --}}
    <div x-show="error" class="mt-4 bg-red-900/20 border border-red-800/30 rounded-xl p-4">
        <p class="text-red-400 text-sm" x-text="error"></p>
    </div>

    {{-- Success modal --}}
    <div x-show="success" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" x-transition>
        <div class="bg-bg-card border border-accent/30 rounded-xl p-8 max-w-md text-center glow-accent">
            <svg class="w-16 h-16 mx-auto mb-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <h2 class="text-2xl font-heading font-bold text-text-primary mb-2">¡Envío exitoso!</h2>
            <p class="text-text-secondary mb-4">Tu código de seguimiento es:</p>
            <p class="text-2xl font-mono text-accent font-bold mb-6" x-text="trackingCode"></p>
            <p class="text-text-muted text-sm mb-4">Guarda este código para consultar el estado de tu envío.</p>
            <a href="{{ route('home') }}" class="inline-block bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-6 py-2 rounded-lg transition">Volver al inicio</a>
        </div>
    </div>

    {{-- Navigation --}}
    <div class="flex justify-between mt-6">
        <button x-show="step > 0" @click="step--" class="px-6 py-2.5 border border-border-primary text-text-secondary rounded-lg hover:bg-bg-hover transition">Anterior</button>
        <div x-show="step === 0"></div>
        <button x-show="step < 3" @click="step++" class="px-6 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition">Siguiente</button>
        <button x-show="step === 3" @click="submitPaper()" :disabled="submitting" class="px-6 py-2.5 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition disabled:opacity-50">
            <span x-show="!submitting">Enviar Paper</span>
            <span x-show="submitting">Enviando...</span>
        </button>
    </div>
</div>

@push('scripts')
<script>
function submitWizard() {
    return {
        steps: ['Autores', 'Información', 'Archivo', 'Confirmación'],
        step: 0,
        authors: [{ name: '', email: '', affiliation: '', isCorresponding: true }],
        form: { title: '', abstract: '', track_id: '', keywords: '' },
        file: null,
        error: null,
        success: false,
        trackingCode: '',
        submitting: false,
        handleFile(e) { this.file = e.target.files[0]; },
        handleDrop(e) { this.file = e.dataTransfer.files[0]; },
        async submitPaper() {
            this.error = null;
            this.submitting = true;
            try {
                const fd = new FormData();
                fd.append('conference_id', {{ $conference->id }});
                fd.append('title', this.form.title);
                fd.append('authors_json', JSON.stringify(this.authors));
                fd.append('abstract', this.form.abstract);
                fd.append('keywords', this.form.keywords);
                if (this.form.track_id) fd.append('track_id', this.form.track_id);
                fd.append('submitted_by_email', this.authors[0].email);
                fd.append('file', this.file);

                const res = await api.postForm('/api/submissions', fd);
                this.trackingCode = res.tracking_code;
                this.success = true;
            } catch (e) {
                this.error = e.error || e.message || 'Error al enviar';
            } finally {
                this.submitting = false;
            }
        }
    };
}
</script>
@endpush
@endsection
