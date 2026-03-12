@extends('layouts.public')
@section('title', 'Iniciar Sesión - OpenPapers')

@section('content')
<div class="max-w-md mx-auto" x-data="{ tab: 'login' }">
    {{-- Tab selector --}}
    <div class="flex mb-6 bg-bg-card border border-border-primary rounded-xl p-1">
        <button @click="tab = 'login'" :class="tab === 'login' ? 'bg-accent text-bg-primary' : 'text-text-secondary'" class="flex-1 py-2 px-4 rounded-lg font-semibold transition">Iniciar Sesión</button>
        <button @click="tab = 'register'" :class="tab === 'register' ? 'bg-accent text-bg-primary' : 'text-text-secondary'" class="flex-1 py-2 px-4 rounded-lg font-semibold transition">Registrarse</button>
    </div>

    {{-- Login Form --}}
    <div x-show="tab === 'login'" class="bg-bg-card border border-border-primary rounded-xl p-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary mb-6">Iniciar Sesión</h1>
        <form method="POST" action="{{ route('login') }}">
            @csrf
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input type="email" name="email" value="{{ old('email') }}" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Contraseña</label>
                    <input type="password" name="password" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                </div>
                @error('email')
                    <p class="text-red-400 text-sm">{{ $message }}</p>
                @enderror
                <button type="submit" class="w-full bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition">Iniciar Sesión</button>
            </div>
        </form>
    </div>

    {{-- Register Form --}}
    <div x-show="tab === 'register'" x-cloak class="bg-bg-card border border-border-primary rounded-xl p-6">
        <h1 class="text-2xl font-heading font-bold text-text-primary mb-6">Crear Cuenta</h1>
        <form method="POST" action="{{ route('register') }}">
            @csrf
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Nombre completo</label>
                    <input type="text" name="full_name" value="{{ old('full_name') }}" required minlength="2" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
                    <input type="email" name="email" value="{{ old('email') }}" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Afiliación (opcional)</label>
                    <input type="text" name="affiliation" value="{{ old('affiliation') }}" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Contraseña</label>
                    <input type="password" name="password" required minlength="8" class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                    <p class="text-text-muted text-xs mt-1">Mínimo 8 caracteres, con mayúsculas, minúsculas y números</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-text-secondary mb-1">Confirmar contraseña</label>
                    <input type="password" name="password_confirmation" required class="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none transition">
                </div>
                @if($errors->any())
                    <div class="text-red-400 text-sm">
                        @foreach($errors->all() as $error)
                            <p>{{ $error }}</p>
                        @endforeach
                    </div>
                @endif
                <button type="submit" class="w-full bg-accent hover:bg-accent-hover text-bg-primary font-semibold py-2.5 rounded-lg transition">Crear Cuenta</button>
            </div>
        </form>
    </div>
</div>
@endsection
