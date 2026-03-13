<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckInstalled
{
    public function handle(Request $request, Closure $next)
    {
        if (!file_exists(storage_path('installed.lock'))) {
            if (file_exists(public_path('install.php'))) {
                return redirect('/install.php');
            }
        }

        return $next($request);
    }
}
