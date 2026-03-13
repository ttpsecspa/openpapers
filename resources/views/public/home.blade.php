@extends('layouts.public')
@section('title', 'OpenPapers - Conferencias Académicas')

@section('content')
<div class="text-center mb-12">
    <h1 class="text-5xl font-heading font-bold text-accent mb-4">OpenPapers</h1>
    <p class="text-xl text-text-secondary max-w-2xl mx-auto">Plataforma de gestión de conferencias académicas. Envía, revisa y gestiona papers de forma segura.</p>
</div>

@if($conferences->isEmpty())
    <div class="text-center py-16">
        <p class="text-text-muted text-lg">No hay conferencias activas en este momento.</p>
    </div>
@else
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        @foreach($conferences as $conference)
        <div class="bg-bg-card border border-border-primary rounded-xl p-6 hover:border-accent/30 hover:glow-accent transition-all">
            <h2 class="text-xl font-heading font-semibold text-text-primary mb-2">{{ $conference->name }}</h2>
            @if($conference->edition)
                <span class="inline-block text-xs bg-accent/10 text-accent px-2 py-1 rounded mb-3">{{ $conference->edition }}</span>
            @endif
            <p class="text-text-secondary text-sm mb-4 line-clamp-3">{{ $conference->description }}</p>

            <div class="space-y-2 text-sm text-text-muted mb-4">
                @if($conference->location)
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {{ $conference->location }}
                    </div>
                @endif
                <div class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    Deadline: {{ $conference->submission_deadline->format('d M Y') }}
                </div>
                <div class="flex items-center gap-4">
                    <span>{{ $conference->tracks_count }} tracks</span>
                    <span>{{ $conference->submissions_count }} envíos</span>
                </div>
            </div>

            <a href="{{ route('cfp.show', $conference->slug) }}" class="block text-center bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2 px-4 rounded-lg transition">
                Ver Convocatoria
            </a>
        </div>
        @endforeach
    </div>
@endif
@endsection
