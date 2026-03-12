<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConferenceMember;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::select('id', 'email', 'full_name', 'affiliation', 'role', 'is_active', 'created_at');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderByDesc('created_at')->get();

        // Enrich with conference membership if requested
        if ($request->filled('conference_id')) {
            $confId = (int) $request->conference_id;
            $members = ConferenceMember::where('conference_id', $confId)
                ->get()
                ->keyBy('user_id');

            $users->each(function ($user) use ($members) {
                $member = $members->get($user->id);
                $user->conference_role = $member?->role;
                $user->conference_tracks = $member?->tracks;
            });
        }

        return response()->json($users);
    }

    /**
     * Create user.
     * CWE-862: Only superadmin can create superadmins.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email|unique:users,email',
            'full_name' => 'required|string|min:2|max:255',
            'affiliation' => 'nullable|string|max:255',
            'role' => 'required|in:' . implode(',', config('openpapers.roles')),
            'password' => 'nullable|string|min:8|max:72',
            'is_active' => 'boolean',
        ]);

        $authUser = $request->user();
        if ($data['role'] === 'superadmin' && ! $authUser->isSuperAdmin()) {
            return response()->json(['error' => 'Solo superadmin puede crear superadmins'], 403);
        }

        $tempPassword = $data['password'] ?? Str::random(12);

        $user = User::create([
            'email' => $data['email'],
            'full_name' => $data['full_name'],
            'affiliation' => $data['affiliation'] ?? null,
            'role' => $data['role'],
            'password' => $tempPassword,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'full_name' => $user->full_name,
            'role' => $user->role,
            'temporary_password' => isset($data['password']) ? null : $tempPassword,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'email' => "sometimes|email|unique:users,email,{$id}",
            'full_name' => 'sometimes|string|min:2|max:255',
            'affiliation' => 'nullable|string|max:255',
            'role' => 'sometimes|in:' . implode(',', config('openpapers.roles')),
            'password' => 'nullable|string|min:8|max:72',
            'is_active' => 'boolean',
        ]);

        $authUser = $request->user();
        if (isset($data['role']) && $data['role'] === 'superadmin' && ! $authUser->isSuperAdmin()) {
            return response()->json(['error' => 'Solo superadmin puede asignar rol superadmin'], 403);
        }

        // Only update password if provided
        if (empty($data['password'])) {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json(['message' => 'Usuario actualizado']);
    }

    /**
     * Invite user to conference.
     */
    public function invite(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => 'required|email',
            'full_name' => 'required|string|min:2|max:255',
            'affiliation' => 'nullable|string|max:255',
            'conference_id' => 'required|integer|exists:conferences,id',
            'role' => 'required|in:chair,reviewer',
            'track_ids' => 'nullable|array',
            'track_ids.*' => 'integer',
        ]);

        $user = User::where('email', $data['email'])->first();
        $tempPassword = null;

        if (! $user) {
            $tempPassword = Str::random(12);
            $user = User::create([
                'email' => $data['email'],
                'full_name' => $data['full_name'],
                'affiliation' => $data['affiliation'] ?? null,
                'role' => 'reviewer',
                'password' => $tempPassword,
                'is_active' => true,
            ]);
        }

        ConferenceMember::updateOrCreate(
            ['conference_id' => $data['conference_id'], 'user_id' => $user->id],
            [
                'role' => $data['role'],
                'tracks' => $data['track_ids'] ?? null,
            ]
        );

        return response()->json([
            'user_id' => $user->id,
            'message' => "{$data['full_name']} invitado como {$data['role']}",
            'temporary_password' => $tempPassword,
        ], 201);
    }
}
