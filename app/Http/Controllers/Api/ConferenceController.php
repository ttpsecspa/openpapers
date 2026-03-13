<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conference;
use App\Models\ConferenceMember;
use App\Models\Track;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConferenceController extends Controller
{
    /**
     * List conferences (CWE-863: admin sees only own conferences).
     */
    public function index(Request $request): JsonResponse
    {
        $conferences = Conference::visibleTo($request->user())
            ->withCount(['submissions', 'tracks'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($conferences);
    }

    /**
     * Create conference (superadmin only).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:conferences,slug|regex:/^[a-z0-9-]+$/',
            'edition' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|url|max:500',
            'website_url' => 'nullable|url|max:500',
            'location' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'submission_deadline' => 'required|date',
            'notification_date' => 'nullable|date',
            'camera_ready_date' => 'nullable|date',
            'is_active' => 'boolean',
            'is_double_blind' => 'boolean',
            'min_reviewers' => 'integer|min:1|max:10',
            'max_file_size_mb' => 'integer|min:1|max:50',
            'custom_fields' => 'nullable|array',
            'tracks' => 'nullable|array',
            'tracks.*.name' => 'required|string|max:255',
            'tracks.*.description' => 'nullable|string',
        ]);

        $conference = DB::transaction(function () use ($data, $request) {
            $tracks = $data['tracks'] ?? [];
            unset($data['tracks']);

            $conference = Conference::create($data);

            // Create tracks
            foreach ($tracks as $i => $track) {
                Track::create([
                    'conference_id' => $conference->id,
                    'name' => $track['name'],
                    'description' => $track['description'] ?? null,
                    'sort_order' => $i,
                ]);
            }

            // Creator becomes chair
            ConferenceMember::create([
                'conference_id' => $conference->id,
                'user_id' => $request->user()->id,
                'role' => 'chair',
            ]);

            return $conference->load('tracks');
        });

        return response()->json($conference, 201);
    }

    /**
     * Update conference (CWE-863: admin only for own conferences).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $conference = Conference::visibleTo($request->user())->findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => "sometimes|string|max:100|unique:conferences,slug,{$id}|regex:/^[a-z0-9-]+$/",
            'edition' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'logo_url' => 'nullable|url|max:500',
            'website_url' => 'nullable|url|max:500',
            'location' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'submission_deadline' => 'sometimes|date',
            'notification_date' => 'nullable|date',
            'camera_ready_date' => 'nullable|date',
            'is_active' => 'boolean',
            'is_double_blind' => 'boolean',
            'min_reviewers' => 'integer|min:1|max:10',
            'max_file_size_mb' => 'integer|min:1|max:50',
            'custom_fields' => 'nullable|array',
            'tracks' => 'nullable|array',
            'tracks.*.name' => 'required|string|max:255',
            'tracks.*.description' => 'nullable|string',
        ]);

        DB::transaction(function () use ($conference, $data) {
            $tracks = $data['tracks'] ?? null;
            unset($data['tracks']);

            $conference->update($data);

            if ($tracks !== null) {
                // Delete old tracks and create new ones
                $conference->tracks()->delete();
                foreach ($tracks as $i => $track) {
                    Track::create([
                        'conference_id' => $conference->id,
                        'name' => $track['name'],
                        'description' => $track['description'] ?? null,
                        'sort_order' => $i,
                    ]);
                }
            }
        });

        return response()->json(['message' => 'Conferencia actualizada']);
    }

    /**
     * Delete conference (superadmin only).
     */
    public function destroy(int $id): JsonResponse
    {
        $conference = Conference::findOrFail($id);
        $conference->delete();

        return response()->json(['message' => 'Conferencia eliminada']);
    }
}
