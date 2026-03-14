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
                // Use raw redirect to avoid session/DB dependency
                return response('', 302)->header('Location', '/install.php');
            }
            abort(503, 'OpenPapers is not installed. Please upload install.php.');
        }

        return $next($request);
    }
}
