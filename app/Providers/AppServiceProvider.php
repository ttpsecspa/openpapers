<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // CWE-307: Rate limiting for brute force protection
        RateLimiter::for('global', function (Request $request) {
            return Limit::perMinute(60)->by($request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinutes(15, 20)->by($request->ip());
        });

        RateLimiter::for('tracking', function (Request $request) {
            return Limit::perMinutes(15, 10)->by($request->ip());
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinutes(15, 300)->by($request->user()?->id ?: $request->ip());
        });
    }
}
