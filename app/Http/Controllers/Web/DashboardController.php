<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function overview()
    {
        return view('dashboard.overview');
    }

    public function submissions()
    {
        return view('dashboard.submissions');
    }

    public function submissionDetail(int $id)
    {
        return view('dashboard.submission-detail', compact('id'));
    }

    public function reviews()
    {
        return view('dashboard.reviews');
    }

    public function reviewForm(int $submissionId)
    {
        return view('dashboard.review-form', compact('submissionId'));
    }

    public function users()
    {
        return view('dashboard.users');
    }

    public function conferences()
    {
        return view('dashboard.conferences');
    }

    public function conferenceForm(Request $request, ?int $id = null)
    {
        return view('dashboard.conference-form', compact('id'));
    }

    public function emailLog()
    {
        return view('dashboard.email-log');
    }

    public function settings()
    {
        return view('dashboard.settings');
    }
}
