<?php

namespace App\Http\Middleware;

use App\Models\ConferenceMember;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Conference-level authorization (CWE-863).
 * Ensures admin users can only access their own conferences.
 * Superadmin bypasses this check.
 */
class CheckConferenceMember
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['error' => 'No autorizado'], 401);
        }

        // Superadmin can access everything
        if ($user->role === 'superadmin') {
            return $next($request);
        }

        $conferenceId = $request->input('conference_id')
            ?? $request->route('conference_id')
            ?? $request->route('conference');

        if (! $conferenceId) {
            return $next($request);
        }

        $member = ConferenceMember::where('conference_id', $conferenceId)
            ->where('user_id', $user->id)
            ->first();

        if (! $member) {
            return response()->json(['error' => 'No tienes acceso a esta conferencia'], 403);
        }

        if (! empty($roles) && ! in_array($member->role, $roles, true)) {
            return response()->json(['error' => 'Rol insuficiente en esta conferencia'], 403);
        }

        $request->merge(['conference_member' => $member]);

        return $next($request);
    }
}
