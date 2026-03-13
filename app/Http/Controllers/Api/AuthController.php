<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with email/password.
     * CWE-307: Rate limited via 'throttle:auth' middleware.
     * CWE-916: Uses bcrypt with cost 12.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Cuenta desactivada.'],
            ]);
        }

        // Session-based auth for web, token for API
        if ($request->wantsJson() || $request->is('api/*')) {
            $token = $user->createToken('api-token')->plainTextToken;
            return response()->json([
                'user' => $this->userResponse($user),
                'token' => $token,
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->userResponse($user)]);
    }

    /**
     * Register a new author account.
     * CWE-521: Password policy enforcement (8-72 chars, upper, lower, number).
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required', 'string', 'min:8', 'max:72',
                'regex:/[A-Z]/',    // at least one uppercase
                'regex:/[a-z]/',    // at least one lowercase
                'regex:/[0-9]/',    // at least one digit
            ],
            'full_name' => 'required|string|min:2|max:255',
            'affiliation' => 'nullable|string|max:255',
        ], [
            'password.regex' => 'La contraseña debe contener mayúsculas, minúsculas y números.',
        ]);

        $user = User::create([
            'email' => $request->email,
            'password' => $request->password, // Auto-hashed via model cast
            'full_name' => $request->full_name,
            'affiliation' => $request->affiliation,
            'role' => 'author',
            'is_active' => true,
        ]);

        if ($request->wantsJson() || $request->is('api/*')) {
            $token = $user->createToken('api-token')->plainTextToken;
            return response()->json([
                'user' => $this->userResponse($user),
                'token' => $token,
            ], 201);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => $this->userResponse($user)], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($request->user()?->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada']);
    }

    private function userResponse(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'affiliation' => $user->affiliation,
            'role' => $user->role,
        ];
    }
}
