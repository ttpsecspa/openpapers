<?php

namespace App\Services;

use App\Models\Conference;
use App\Models\ConferenceMember;
use App\Models\ReviewAssignment;
use App\Models\Submission;
use Illuminate\Support\Facades\DB;

class AutoAssignService
{
    /**
     * Auto-assign reviewers to submissions using load-balanced algorithm.
     * Preserves: author conflict check, track compatibility, min_reviewers.
     */
    public function autoAssign(int $conferenceId): array
    {
        $conference = Conference::findOrFail($conferenceId);
        $minReviewers = $conference->min_reviewers;

        $submissions = Submission::where('conference_id', $conferenceId)
            ->whereIn('status', ['submitted', 'under_review'])
            ->get();

        $assignments = 0;
        $errors = [];

        DB::transaction(function () use ($submissions, $conferenceId, $minReviewers, &$assignments, &$errors) {
            foreach ($submissions as $submission) {
                $existingCount = ReviewAssignment::where('submission_id', $submission->id)->count();
                $needed = $minReviewers - $existingCount;

                if ($needed <= 0) continue;

                $authorEmails = $submission->authorEmails();
                $existingReviewerIds = ReviewAssignment::where('submission_id', $submission->id)
                    ->pluck('reviewer_id')->toArray();

                // Get eligible reviewers with load counts
                $reviewers = $this->getEligibleReviewers(
                    $conferenceId,
                    $submission->track_id,
                    $authorEmails,
                    $existingReviewerIds
                );

                if ($reviewers->isEmpty()) {
                    $errors[] = [
                        'submission_id' => $submission->id,
                        'message' => "No hay revisores disponibles para '{$submission->title}'",
                    ];
                    continue;
                }

                // Assign top N by lowest load
                $toAssign = $reviewers->take($needed);

                foreach ($toAssign as $reviewer) {
                    ReviewAssignment::create([
                        'submission_id' => $submission->id,
                        'reviewer_id' => $reviewer->user_id,
                    ]);
                    $assignments++;
                }

                // Update status to under_review
                if ($submission->status === 'submitted') {
                    $submission->update(['status' => 'under_review']);
                }
            }
        });

        return [
            'assignments' => $assignments,
            'errors' => $errors,
        ];
    }

    private function getEligibleReviewers(int $conferenceId, ?int $trackId, array $authorEmails, array $excludeIds)
    {
        $query = ConferenceMember::where('conference_id', $conferenceId)
            ->whereHas('user', function ($q) use ($authorEmails) {
                $q->where('is_active', true);
                // Exclude authors (conflict of interest)
                if (! empty($authorEmails)) {
                    $q->whereNotIn('email', $authorEmails);
                }
            });

        if (! empty($excludeIds)) {
            $query->whereNotIn('user_id', $excludeIds);
        }

        // Track compatibility
        if ($trackId) {
            $query->where(function ($q) use ($trackId) {
                $q->whereNull('tracks')
                  ->orWhereJsonContains('tracks', $trackId);
            });
        }

        // Get with current load (number of pending assignments)
        $members = $query->get();

        return $members->map(function ($member) {
            $member->current_load = ReviewAssignment::where('reviewer_id', $member->user_id)
                ->where('status', '!=', 'declined')
                ->count();
            return $member;
        })->sortBy('current_load');
    }
}
