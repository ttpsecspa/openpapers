<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'OpenPapers')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        'bg-primary': '#06080d',
                        'bg-secondary': '#0d1117',
                        'bg-card': '#161b22',
                        'bg-hover': '#1c2333',
                        'border-primary': '#1e293b',
                        'border-hover': '#30363d',
                        'accent': '#2dd4a8',
                        'accent-hover': '#22b892',
                        'text-primary': '#e6edf3',
                        'text-secondary': '#8b949e',
                        'text-muted': '#484f58',
                    },
                    fontFamily: {
                        heading: ['Outfit', 'sans-serif'],
                        body: ['DM Sans', 'sans-serif'],
                    },
                }
            }
        }
    </script>
    <style>
        body { font-family: 'DM Sans', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Outfit', sans-serif; }
        .glow-accent { box-shadow: 0 0 20px rgba(45, 212, 168, 0.15); }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #484f58; }
    </style>
    @stack('styles')
</head>
<body class="bg-bg-primary text-text-primary min-h-screen">
    @yield('body')

    <script>
        // Global API helper with CSRF token
        const api = {
            _headers() {
                return {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                };
            },
            async get(url) {
                const res = await fetch(url, { headers: this._headers(), credentials: 'same-origin' });
                if (!res.ok) throw await res.json();
                return res.json();
            },
            async post(url, data) {
                const res = await fetch(url, { method: 'POST', headers: this._headers(), credentials: 'same-origin', body: JSON.stringify(data) });
                if (!res.ok) throw await res.json();
                return res.json();
            },
            async put(url, data) {
                const res = await fetch(url, { method: 'PUT', headers: this._headers(), credentials: 'same-origin', body: JSON.stringify(data) });
                if (!res.ok) throw await res.json();
                return res.json();
            },
            async patch(url, data) {
                const res = await fetch(url, { method: 'PATCH', headers: this._headers(), credentials: 'same-origin', body: JSON.stringify(data) });
                if (!res.ok) throw await res.json();
                return res.json();
            },
            async delete(url) {
                const res = await fetch(url, { method: 'DELETE', headers: this._headers(), credentials: 'same-origin' });
                if (!res.ok) throw await res.json();
                return res.json();
            },
            async postForm(url, formData) {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') },
                    credentials: 'same-origin',
                    body: formData,
                });
                if (!res.ok) throw await res.json();
                return res.json();
            },
        };

        function formatDate(dateStr) {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        }
    </script>
    @stack('scripts')
</body>
</html>
