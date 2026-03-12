@extends('layouts.app')

@section('body')
    {{-- Header --}}
    <header class="border-b border-border-primary bg-bg-secondary/80 backdrop-blur-sm sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="{{ route('home') }}" class="flex items-center gap-2">
                <span class="text-2xl font-heading font-bold text-accent">OpenPapers</span>
            </a>
            <nav class="flex items-center gap-6">
                <a href="{{ route('home') }}" class="text-text-secondary hover:text-text-primary transition">Inicio</a>
                <a href="{{ route('track.status') }}" class="text-text-secondary hover:text-text-primary transition">Estado</a>
                @auth
                    <a href="{{ route('dashboard.overview') }}" class="bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-4 py-2 rounded-lg transition">Dashboard</a>
                @else
                    <a href="{{ route('login') }}" class="bg-accent hover:bg-accent-hover text-bg-primary font-semibold px-4 py-2 rounded-lg transition">Iniciar Sesión</a>
                @endauth
            </nav>
        </div>
    </header>

    {{-- Content --}}
    <main class="max-w-6xl mx-auto px-4 py-8">
        @yield('content')
    </main>

    {{-- Footer --}}
    <footer class="border-t border-border-primary mt-auto py-6">
        <div class="max-w-6xl mx-auto px-4 text-center text-text-muted text-sm">
            <p>&copy; {{ date('Y') }} OpenPapers — Sistema de gestión de conferencias académicas</p>
        </div>
    </footer>
@endsection
