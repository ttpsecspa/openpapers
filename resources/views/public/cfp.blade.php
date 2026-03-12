@extends('layouts.public')
@section('title', $conference->name . ' - Call for Papers')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="mb-8">
        <h1 class="text-4xl font-heading font-bold text-text-primary mb-2">{{ $conference->name }}</h1>
        @if($conference->edition)
            <span class="inline-block text-sm bg-accent/10 text-accent px-3 py-1 rounded-full">{{ $conference->edition }}</span>
        @endif
    </div>

    @if($conference->description)
        <div class="bg-bg-card border border-border-primary rounded-xl p-6 mb-8">
            <p class="text-text-secondary leading-relaxed">{{ $conference->description }}</p>
        </div>
    @endif

    {{-- Timeline --}}
    <div class="bg-bg-card border border-border-primary rounded-xl p-6 mb-8">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Fechas Importantes</h2>
        <div class="space-y-4">
            @foreach([
                ['label' => 'Fecha límite de envío', 'date' => $conference->submission_deadline, 'highlight' => true],
                ['label' => 'Notificación de resultados', 'date' => $conference->notification_date],
                ['label' => 'Camera-ready', 'date' => $conference->camera_ready_date],
                ['label' => 'Inicio de la conferencia', 'date' => $conference->start_date],
                ['label' => 'Fin de la conferencia', 'date' => $conference->end_date],
            ] as $item)
                @if($item['date'])
                <div class="flex items-center gap-4">
                    <div class="w-3 h-3 rounded-full {{ ($item['highlight'] ?? false) ? 'bg-accent' : 'bg-border-hover' }}"></div>
                    <div>
                        <span class="text-text-muted text-sm">{{ $item['label'] }}</span>
                        <span class="text-text-primary ml-2">{{ $item['date']->format('d M Y') }}</span>
                    </div>
                </div>
                @endif
            @endforeach
        </div>
    </div>

    {{-- Tracks --}}
    @if($conference->tracks->isNotEmpty())
    <div class="bg-bg-card border border-border-primary rounded-xl p-6 mb-8">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Tracks</h2>
        <div class="space-y-3">
            @foreach($conference->tracks as $track)
            <div class="p-4 bg-bg-secondary rounded-lg border border-border-primary">
                <h3 class="font-semibold text-text-primary">{{ $track->name }}</h3>
                @if($track->description)
                    <p class="text-text-secondary text-sm mt-1">{{ $track->description }}</p>
                @endif
            </div>
            @endforeach
        </div>
    </div>
    @endif

    {{-- Info --}}
    <div class="bg-bg-card border border-border-primary rounded-xl p-6 mb-8">
        <h2 class="text-xl font-heading font-semibold text-text-primary mb-4">Información</h2>
        <div class="grid md:grid-cols-2 gap-4 text-sm">
            @if($conference->location)
                <div><span class="text-text-muted">Ubicación:</span> <span class="text-text-primary">{{ $conference->location }}</span></div>
            @endif
            @if($conference->website_url)
                <div><span class="text-text-muted">Sitio web:</span> <a href="{{ $conference->website_url }}" target="_blank" class="text-accent hover:underline">{{ $conference->website_url }}</a></div>
            @endif
            <div><span class="text-text-muted">Revisión doble ciego:</span> <span class="text-text-primary">{{ $conference->is_double_blind ? 'Sí' : 'No' }}</span></div>
            <div><span class="text-text-muted">Revisores mínimos:</span> <span class="text-text-primary">{{ $conference->min_reviewers }}</span></div>
        </div>
    </div>

    {{-- Submit CTA --}}
    @if(!$conference->submission_deadline->isPast())
    <div class="text-center">
        <a href="{{ route('submit.form', $conference->slug) }}" class="inline-block bg-accent hover:bg-accent-hover text-bg-primary font-bold text-lg py-3 px-8 rounded-xl transition glow-accent">
            Enviar Paper
        </a>
    </div>
    @else
    <div class="text-center p-4 bg-red-900/20 border border-red-800/30 rounded-xl">
        <p class="text-red-400 font-semibold">El plazo de envío ha expirado</p>
    </div>
    @endif
</div>
@endsection
