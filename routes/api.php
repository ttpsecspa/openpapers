<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ConferenceController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes (no authentication required)
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

Route::get('/conferences', [PublicController::class, 'listConferences']);
Route::get('/conferences/{slug}', [PublicController::class, 'conferenceDetail']);
Route::post('/submissions', [SubmissionController::class, 'submit']);
Route::get('/submissions/track/{code}', [PublicController::class, 'trackStatus'])
    ->middleware('throttle:tracking');

/*
|--------------------------------------------------------------------------
| Dashboard API Routes (authentication required)
|--------------------------------------------------------------------------
*/

Route::prefix('dashboard')->middleware(['auth:sanctum', 'throttle:api'])->group(function () {

    // Submissions (role-filtered in controller)
    Route::get('/submissions', [SubmissionController::class, 'index']);
    Route::get('/submissions/{id}', [SubmissionController::class, 'show']);
    Route::patch('/submissions/{id}/status', [SubmissionController::class, 'updateStatus'])
        ->middleware('role:superadmin,admin');
    Route::patch('/submissions/{id}/assign', [SubmissionController::class, 'assignReviewers'])
        ->middleware('role:superadmin,admin');

    // Reviews
    Route::get('/reviews/my', [ReviewController::class, 'myReviews']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{id}', [ReviewController::class, 'update']);

    // Conferences (superadmin/admin)
    Route::get('/conferences', [ConferenceController::class, 'index'])
        ->middleware('role:superadmin,admin');
    Route::post('/conferences', [ConferenceController::class, 'store'])
        ->middleware('role:superadmin');
    Route::put('/conferences/{id}', [ConferenceController::class, 'update'])
        ->middleware('role:superadmin,admin');
    Route::delete('/conferences/{id}', [ConferenceController::class, 'destroy'])
        ->middleware('role:superadmin');

    // Users (superadmin/admin)
    Route::get('/users', [UserController::class, 'index'])
        ->middleware('role:superadmin,admin');
    Route::post('/users', [UserController::class, 'store'])
        ->middleware('role:superadmin,admin');
    Route::put('/users/{id}', [UserController::class, 'update'])
        ->middleware('role:superadmin,admin');
    Route::post('/users/invite', [UserController::class, 'invite'])
        ->middleware('role:superadmin,admin');

    // Stats
    Route::get('/stats', [StatsController::class, 'index'])
        ->middleware('role:superadmin,admin');

    // Auto-assign
    Route::post('/auto-assign', [SubmissionController::class, 'autoAssign'])
        ->middleware('role:superadmin,admin');

    // Email log
    Route::get('/email-log', [StatsController::class, 'emailLog'])
        ->middleware('role:superadmin,admin');

    // Settings (superadmin only)
    Route::get('/settings', [SettingsController::class, 'index'])
        ->middleware('role:superadmin');
    Route::put('/settings', [SettingsController::class, 'update'])
        ->middleware('role:superadmin');

    // File download (authenticated, access-controlled)
    Route::get('/uploads/{filename}', [SubmissionController::class, 'download']);
});
