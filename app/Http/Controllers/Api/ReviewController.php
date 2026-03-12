<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ReviewAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Get reviewer's assignments with submission details.
     */
    public function myReviews(Request $request): JsonResponse
    {
        $assignments = ReviewAssignment::where('reviewer_id', $request->user()->id)
            ->with(['submission:id,title,tracking_code,status,track_id,conference_id', 'submission.track:id,name', 'submission.conference:id,name'])
            ->get();

        return response()->json($assignments);
    }

    /**
     * Submit a review.
     * CWE-862: Reviewer must be assigned (unless superadmin/admin).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'submission_id' => 'required|integer|exists:submissions,id',
            'overall_score' => 'required|integer|min:1|max:10',
            'originality_score' => 'nullable|integer|min:1|max:10',
            'technical_score' => 'nullable|integer|min:1|max:10',
            'clarity_score' => 'nullable|integer|min:1|max:10',
            'relevance_score' => 'nullable|integer|min:1|max:10',
            'recommendation' => 'required|in:' . implode(',', config('openpapers.recommendations')),
            'comments_to_authors' => 'required|string|min:10',
            'comments_to_chairs' => 'nullable|string',
            'confidence' => 'nullable|integer|min:1|max:5',
        ]);

        $user = $request->user();

        // Check assignment exists for reviewer role
        if ($user->role === 'reviewer') {
            $assignment = ReviewAssignment::where('submission_id', $data['submission_id'])
                ->where('reviewer_id', $user->id)
                ->first();

            if (! $assignment) {
                return response()->json(['error' => 'No tienes asignación para esta submission'], 403);
            }
        }

        // Check for existing review
        $existing = Review::where('submission_id', $data['submission_id'])
            ->where('reviewer_id', $user->id)
            ->exists();

        if ($existing) {
            return response()->json(['error' => 'Ya existe una revisión para esta submission'], 422);
        }

        $review = Review::create([
            ...$data,
            'reviewer_id' => $user->id,
            'submitted_at' => now(),
        ]);

        // Mark assignment as completed
        ReviewAssignment::where('submission_id', $data['submission_id'])
            ->where('reviewer_id', $user->id)
            ->update(['status' => 'completed']);

        return response()->json(['id' => $review->id, 'message' => 'Revisión enviada'], 201);
    }

    /**
     * Update an existing review.
     * CWE-862: Reviewer can only update own review.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $user = $request->user();

        // Only own reviews (reviewer), or any review (admin/superadmin)
        if ($user->role === 'reviewer' && $review->reviewer_id !== $user->id) {
            return response()->json(['error' => 'Solo puedes editar tus propias revisiones'], 403);
        }

        // Verify assignment still exists
        $assignment = ReviewAssignment::where('submission_id', $review->submission_id)
            ->where('reviewer_id', $review->reviewer_id)
            ->first();

        if (! $assignment) {
            return response()->json(['error' => 'La asignación ya no existe'], 422);
        }

        $data = $request->validate([
            'overall_score' => 'sometimes|integer|min:1|max:10',
            'originality_score' => 'nullable|integer|min:1|max:10',
            'technical_score' => 'nullable|integer|min:1|max:10',
            'clarity_score' => 'nullable|integer|min:1|max:10',
            'relevance_score' => 'nullable|integer|min:1|max:10',
            'recommendation' => 'sometimes|in:' . implode(',', config('openpapers.recommendations')),
            'comments_to_authors' => 'sometimes|string|min:10',
            'comments_to_chairs' => 'nullable|string',
            'confidence' => 'nullable|integer|min:1|max:5',
        ]);

        $review->update($data);

        return response()->json(['message' => 'Revisión actualizada']);
    }
}
