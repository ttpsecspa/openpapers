<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conference;
use App\Models\ConferenceMember;
use App\Models\ReviewAssignment;
use App\Models\Submission;
use App\Services\AutoAssignService;
use App\Services\MailerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SubmissionController extends Controller
{
    /**
     * Public: Submit a paper.
     * CWE-434: File upload validation (PDF only, size limit).
     * CWE-400: Cleanup orphan files on validation failure.
     */
    public function submit(Request $request): JsonResponse
    {
        $request->validate([
            'conference_id' => 'required|integer|exists:conferences,id',
            'title' => 'required|string|min:5|max:500',
            'authors_json' => 'required|json',
            'abstract' => 'required|string|min:50',
            'keywords' => 'nullable|string|max:500',
            'track_id' => 'nullable|integer|exists:tracks,id',
            'submitted_by_email' => 'required|email',
            'file' => 'required|file|mimes:pdf|max:' . (config('openpapers.max_file_size_mb') * 1024),
        ]);

        $conference = Conference::findOrFail($request->conference_id);

        // Check deadline
        if ($conference->submission_deadline->isPast()) {
            return response()->json(['error' => 'El plazo de envío ha expirado'], 422);
        }

        // Validate authors JSON
        $authors = json_decode($request->authors_json, true);
        if (! is_array($authors) || empty($authors)) {
            return response()->json(['error' => 'Se requiere al menos un autor'], 422);
        }

        $filePath = null;
        try {
            // Store file with random name (CWE-434)
            $file = $request->file('file');
            $randomName = bin2hex(random_bytes(16)) . '.pdf';
            $filePath = $file->storeAs('uploads', $randomName);

            // Generate tracking code
            $trackingCode = $this->generateTrackingCode($conference);

            $submission = Submission::create([
                'conference_id' => $conference->id,
                'tracking_code' => $trackingCode,
                'title' => $request->title,
                'authors_json' => $authors,
                'abstract' => $request->abstract,
                'keywords' => $request->keywords,
                'track_id' => $request->track_id,
                'file_path' => $randomName,
                'file_original_name' => $file->getClientOriginalName(),
                'submitted_by_email' => $request->submitted_by_email,
            ]);

            // Send confirmation email
            app(MailerService::class)->sendSubmissionConfirmation(
                $request->submitted_by_email,
                [
                    'trackingCode' => $trackingCode,
                    'title' => $request->title,
                    'conferenceName' => $conference->name,
                ],
                $conference->id
            );

            return response()->json([
                'id' => $submission->id,
                'tracking_code' => $trackingCode,
                'message' => 'Envío registrado exitosamente',
            ], 201);
        } catch (\Exception $e) {
            // CWE-400: Cleanup orphan file
            if ($filePath) {
                Storage::delete($filePath);
            }
            throw $e;
        }
    }

    /**
     * Dashboard: List submissions (paginated, filtered, role-scoped).
     * CWE-863: Scope filtering based on user role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Submission::visibleTo($user)
            ->with(['track:id,name', 'conference:id,name,slug']);

        if ($request->filled('conference_id')) {
            $query->where('conference_id', (int) $request->conference_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('track_id')) {
            $query->where('track_id', (int) $request->track_id);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('tracking_code', 'like', "%{$search}%");
            });
        }

        $submissions = $query->orderByDesc('created_at')->paginate(20);

        // Double-blind: strip author info for reviewers
        if ($user->role === 'reviewer') {
            $submissions->getCollection()->transform(function ($s) {
                $s->makeHidden(['authors_json', 'submitted_by_email']);
                return $s;
            });
        }

        return response()->json($submissions);
    }

    /**
     * Dashboard: Show submission detail with reviews and assignments.
     * CWE-862: IDOR protection via role-based access.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $submission = Submission::visibleTo($user)
            ->with(['track', 'conference', 'reviews.reviewer:id,full_name', 'assignments.reviewer:id,full_name,email'])
            ->findOrFail($id);

        // Double-blind masking for reviewers
        if ($user->role === 'reviewer') {
            $submission->makeHidden(['authors_json', 'submitted_by_email']);
            // Hide other reviewer identities
            $submission->reviews->each(function ($r) use ($user) {
                if ($r->reviewer_id !== $user->id) {
                    $r->makeHidden(['reviewer']);
                }
            });
        }

        return response()->json($submission);
    }

    /**
     * Dashboard: Update submission status.
     * CWE-863: Admin can only update their conferences.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:' . implode(',', config('openpapers.statuses')),
            'decision_notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $submission = Submission::visibleTo($user)->findOrFail($id);

        $submission->update([
            'status' => $request->status,
            'decision_notes' => $request->decision_notes,
        ]);

        // Send decision emails
        $mailer = app(MailerService::class);
        $vars = [
            'trackingCode' => $submission->tracking_code,
            'title' => $submission->title,
            'conferenceName' => $submission->conference->name,
            'reviews' => $this->formatReviewsForEmail($submission),
            'decision_notes' => $request->decision_notes,
            'cameraReadyDate' => $submission->conference->camera_ready_date?->format('Y-m-d'),
            'avgScore' => round($submission->reviews()->avg('overall_score'), 1),
        ];

        match ($request->status) {
            'accepted' => $mailer->sendDecisionAccepted($submission->submitted_by_email, $vars, $submission->conference_id),
            'rejected' => $mailer->sendDecisionRejected($submission->submitted_by_email, $vars, $submission->conference_id),
            'revision_requested' => $mailer->sendDecisionRevision($submission->submitted_by_email, $vars, $submission->conference_id),
            default => null,
        };

        return response()->json(['message' => 'Estado actualizado']);
    }

    /**
     * Dashboard: Assign reviewers to submission.
     * Validates: no author-reviewer conflicts, track compatibility.
     */
    public function assignReviewers(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reviewer_ids' => 'required|array|min:1',
            'reviewer_ids.*' => 'integer|exists:users,id',
            'deadline' => 'nullable|date|after:today',
        ]);

        $user = $request->user();
        $submission = Submission::visibleTo($user)->with('conference')->findOrFail($id);

        $authorEmails = $submission->authorEmails();
        $errors = [];

        DB::transaction(function () use ($request, $submission, $authorEmails, &$errors) {
            foreach ($request->reviewer_ids as $reviewerId) {
                $reviewer = \App\Models\User::find($reviewerId);
                if (! $reviewer) continue;

                // Check author-reviewer conflict
                if (in_array($reviewer->email, $authorEmails, true)) {
                    $errors[] = "Conflicto: {$reviewer->full_name} es autor del paper";
                    continue;
                }

                // Check if already assigned
                $exists = ReviewAssignment::where('submission_id', $submission->id)
                    ->where('reviewer_id', $reviewerId)->exists();
                if ($exists) continue;

                ReviewAssignment::create([
                    'submission_id' => $submission->id,
                    'reviewer_id' => $reviewerId,
                    'deadline' => $request->deadline,
                ]);

                // Send assignment email
                app(MailerService::class)->sendReviewAssignment(
                    $reviewer->email,
                    [
                        'title' => $submission->title,
                        'conferenceName' => $submission->conference->name,
                        'deadline' => $request->deadline,
                    ],
                    $submission->conference_id
                );
            }

            // Update status to under_review if needed
            if ($submission->status === 'submitted') {
                $submission->update(['status' => 'under_review']);
            }
        });

        return response()->json([
            'message' => 'Revisores asignados',
            'errors' => $errors,
        ]);
    }

    /**
     * Dashboard: Auto-assign reviewers.
     */
    public function autoAssign(Request $request): JsonResponse
    {
        $request->validate([
            'conference_id' => 'required|integer|exists:conferences,id',
        ]);

        $user = $request->user();

        // CWE-863: Admin can only auto-assign their conferences
        if (! $user->isSuperAdmin()) {
            $isMember = ConferenceMember::where('conference_id', $request->conference_id)
                ->where('user_id', $user->id)->exists();
            if (! $isMember) {
                return response()->json(['error' => 'No tienes acceso a esta conferencia'], 403);
            }
        }

        $result = app(AutoAssignService::class)->autoAssign($request->conference_id);

        return response()->json($result);
    }

    /**
     * Dashboard: Download submission file.
     * CWE-862: IDOR protection - reviewer must be assigned, admin must be chair.
     * CWE-22: Path traversal protection.
     * CWE-116: Content-Disposition sanitization.
     */
    public function download(Request $request, string $filename): \Symfony\Component\HttpFoundation\Response
    {
        $user = $request->user();

        // CWE-22: Path traversal protection
        $safeFilename = basename($filename);
        $filePath = storage_path('app/uploads/' . $safeFilename);

        if (! file_exists($filePath)) {
            abort(404, 'Archivo no encontrado');
        }

        // Find submission by file path
        $submission = Submission::where('file_path', $safeFilename)->firstOrFail();

        // Access control
        if ($user->role === 'reviewer') {
            $hasAssignment = ReviewAssignment::where('submission_id', $submission->id)
                ->where('reviewer_id', $user->id)->exists();
            if (! $hasAssignment) {
                abort(403, 'No tienes acceso a este archivo');
            }
        } elseif ($user->role === 'admin') {
            $isChair = ConferenceMember::where('conference_id', $submission->conference_id)
                ->where('user_id', $user->id)->exists();
            if (! $isChair) {
                abort(403, 'No tienes acceso a este archivo');
            }
        }
        // superadmin can download anything

        // CWE-116: Sanitize filename for Content-Disposition
        $downloadName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $submission->file_original_name ?? $safeFilename);

        return response()->download($filePath, $downloadName, [
            'Content-Type' => 'application/pdf',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function generateTrackingCode(Conference $conference): string
    {
        $prefix = 'CFP-' . strtoupper($conference->slug) . '-' . date('Y');
        $last = Submission::where('tracking_code', 'like', $prefix . '-%')
            ->orderByDesc('tracking_code')
            ->value('tracking_code');

        $seq = 1;
        if ($last) {
            $parts = explode('-', $last);
            $seq = ((int) end($parts)) + 1;
        }

        return $prefix . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    private function formatReviewsForEmail(Submission $submission): string
    {
        return $submission->reviews->map(function ($r) {
            return "Score: {$r->overall_score}/10 - {$r->recommendation}\n{$r->comments_to_authors}";
        })->implode("\n\n---\n\n");
    }
}
