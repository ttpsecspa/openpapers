<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conference;
use App\Models\EmailLog;
use App\Models\Review;
use App\Models\ReviewAssignment;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Dashboard statistics (CWE-863: admin scoped to own conferences).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $conferenceId = $request->filled('conference_id') ? (int) $request->conference_id : null;

        $submissionQuery = Submission::query();
        $reviewQuery = Review::query();
        $assignmentQuery = ReviewAssignment::query();

        // Scope to conference
        if ($conferenceId) {
            // CWE-863: verify access
            if (! $user->isSuperAdmin()) {
                $conference = Conference::visibleTo($user)->findOrFail($conferenceId);
            }
            $submissionQuery->where('conference_id', $conferenceId);
            $reviewQuery->whereHas('submission', fn($q) => $q->where('conference_id', $conferenceId));
            $assignmentQuery->whereHas('submission', fn($q) => $q->where('conference_id', $conferenceId));
        } elseif (! $user->isSuperAdmin()) {
            $confIds = $user->conferenceIds();
            $submissionQuery->whereIn('conference_id', $confIds);
            $reviewQuery->whereHas('submission', fn($q) => $q->whereIn('conference_id', $confIds));
            $assignmentQuery->whereHas('submission', fn($q) => $q->whereIn('conference_id', $confIds));
        }

        // Submission stats
        $totalSubmissions = $submissionQuery->count();
        $byStatus = (clone $submissionQuery)->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')->pluck('count', 'status');
        $byTrack = (clone $submissionQuery)->join('tracks', 'submissions.track_id', '=', 'tracks.id')
            ->select('tracks.name', DB::raw('count(*) as count'))
            ->groupBy('tracks.name')->get();
        $byDate = (clone $submissionQuery)->select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('count(*) as count')
        )->groupBy('date')->orderBy('date')->get();

        // Review stats
        $totalReviews = $reviewQuery->count();
        $pendingAssignments = (clone $assignmentQuery)->where('status', 'pending')->count();
        $completedAssignments = (clone $assignmentQuery)->where('status', 'completed')->count();
        $avgScore = (clone $reviewQuery)->avg('overall_score');

        $scoreDistribution = [
            '1-3' => (clone $reviewQuery)->whereBetween('overall_score', [1, 3])->count(),
            '4-5' => (clone $reviewQuery)->whereBetween('overall_score', [4, 5])->count(),
            '6-7' => (clone $reviewQuery)->whereBetween('overall_score', [6, 7])->count(),
            '8-10' => (clone $reviewQuery)->whereBetween('overall_score', [8, 10])->count(),
        ];

        // Reviewer stats
        $totalReviewers = (clone $assignmentQuery)->distinct('reviewer_id')->count('reviewer_id');
        $activeReviewers = (clone $assignmentQuery)->where('status', 'pending')
            ->distinct('reviewer_id')->count('reviewer_id');

        // Timeline
        $timeline = null;
        if ($conferenceId) {
            $conf = Conference::find($conferenceId);
            if ($conf) {
                $timeline = [
                    'submission_deadline' => $conf->submission_deadline,
                    'days_to_deadline' => now()->diffInDays($conf->submission_deadline, false),
                ];
            }
        }

        return response()->json([
            'submissions' => [
                'total' => $totalSubmissions,
                'by_status' => $byStatus,
                'by_track' => $byTrack,
                'by_date' => $byDate,
            ],
            'reviews' => [
                'total' => $totalReviews,
                'pending' => $pendingAssignments,
                'completed' => $completedAssignments,
                'avg_score' => $avgScore ? round($avgScore, 1) : null,
                'score_distribution' => $scoreDistribution,
            ],
            'reviewers' => [
                'total' => $totalReviewers,
                'active' => $activeReviewers,
            ],
            'timeline' => $timeline,
        ]);
    }

    /**
     * Email log (CWE-863: admin scoped to own conferences).
     */
    public function emailLog(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = EmailLog::query();

        if (! $user->isSuperAdmin()) {
            $confIds = $user->conferenceIds();
            $query->whereIn('conference_id', $confIds);
        }

        if ($request->filled('conference_id')) {
            $query->where('conference_id', (int) $request->conference_id);
        }
        if ($request->filled('template')) {
            $query->where('template', $request->template);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $logs = $query->orderByDesc('sent_at')->paginate(20);

        return response()->json($logs);
    }
}
