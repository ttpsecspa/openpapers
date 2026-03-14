<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->prepend(\App\Http\Middleware\CheckInstalled::class);
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
            'conference.member' => \App\Http\Middleware\CheckConferenceMember::class,
        ]);

        $middleware->api(prepend: [
            \Illuminate\Session\Middleware\StartSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Hide detailed errors in production (CWE-200)
        $exceptions->shouldRenderJsonWhen(function ($request) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // Redirect to installer if DB is not configured
        $exceptions->renderable(function (\Throwable $e, $request) {
            if (($e instanceof \Illuminate\Database\QueryException || $e instanceof \PDOException)
                && !file_exists(storage_path('installed.lock'))
                && file_exists(public_path('install.php'))) {
                // Raw header redirect to avoid any framework dependency
                header('Location: /install.php');
                exit;
            }
        });
    })->create();
