<?php

use App\Http\Controllers\Web\AuthController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\PublicController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/cfp/{slug}', [PublicController::class, 'cfp'])->name('cfp.show');
Route::get('/enviar/{slug}', [PublicController::class, 'submit'])->name('submit.form');
Route::get('/estado', [PublicController::class, 'track'])->name('track.status');

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

/*
|--------------------------------------------------------------------------
| Dashboard Routes (authenticated)
|--------------------------------------------------------------------------
*/

Route::prefix('dashboard')->middleware('auth')->name('dashboard.')->group(function () {
    Route::get('/', [DashboardController::class, 'overview'])->name('overview');
    Route::get('/submissions', [DashboardController::class, 'submissions'])->name('submissions');
    Route::get('/submissions/{id}', [DashboardController::class, 'submissionDetail'])->name('submissions.show');
    Route::get('/reviews', [DashboardController::class, 'reviews'])->name('reviews');
    Route::get('/reviews/{submissionId}', [DashboardController::class, 'reviewForm'])->name('reviews.form');

    Route::get('/users', [DashboardController::class, 'users'])
        ->middleware('role:superadmin,admin')->name('users');
    Route::get('/conferences', [DashboardController::class, 'conferences'])
        ->middleware('role:superadmin,admin')->name('conferences');
    Route::get('/conferences/new', [DashboardController::class, 'conferenceForm'])
        ->middleware('role:superadmin')->name('conferences.create');
    Route::get('/conferences/{id}/edit', [DashboardController::class, 'conferenceForm'])
        ->middleware('role:superadmin,admin')->name('conferences.edit');
    Route::get('/email-log', [DashboardController::class, 'emailLog'])
        ->middleware('role:superadmin,admin')->name('email-log');
    Route::get('/settings', [DashboardController::class, 'settings'])
        ->middleware('role:superadmin')->name('settings');
});
