<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conference;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function listConferences(): JsonResponse
    {
        $conferences = Conference::where('is_active', true)
            ->withCount(['tracks', 'submissions'])
            ->orderBy('submission_deadline')
            ->get();

        return response()->json($conferences);
    }

    public function conferenceDetail(string $slug): JsonResponse
    {
        $conference = Conference::where('slug', $slug)
            ->with('tracks')
            ->firstOrFail();

        return response()->json($conference);
    }

    /**
     * Track submission status by tracking code.
     * CWE-200: Only shows reviews when decision is made.
     * CWE-307: Rate limited via 'throttle:tracking' middleware.
     */
    public function trackStatus(string $code): JsonResponse
    {
        $submission = Submission::where('tracking_code', $code)
            ->with(['track:id,name', 'conference:id,name,slug'])
            ->first();

        if (! $submission) {
            return response()->json(['error' => 'Código de seguimiento no encontrado'], 404);
        }

        $data = [
            'tracking_code' => $submission->tracking_code,
            'title' => $submission->title,
            'status' => $submission->status,
            'conference' => $submission->conference?->name,
            'track' => $submission->track?->name,
            'submitted_at' => $submission->created_at,
        ];

        // Only show reviews when a decision has been made
        $decisionStatuses = ['accepted', 'rejected', 'revision_requested'];
        if (in_array($submission->status, $decisionStatuses, true)) {
            $reviews = $submission->reviews()->get()->map(fn($r) => [
                'overall_score' => $r->overall_score,
                'recommendation' => $r->recommendation,
                'comments_to_authors' => $r->comments_to_authors,
            ]);
            $data['reviews'] = $reviews;
            $data['decision_notes'] = $submission->decision_notes;
        }

        return response()->json($data);
    }
}
