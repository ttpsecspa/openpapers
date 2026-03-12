<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Conference;

class PublicController extends Controller
{
    public function home()
    {
        $conferences = Conference::where('is_active', true)
            ->withCount(['tracks', 'submissions'])
            ->orderBy('submission_deadline')
            ->get();

        return view('public.home', compact('conferences'));
    }

    public function cfp(string $slug)
    {
        $conference = Conference::where('slug', $slug)
            ->with('tracks')
            ->firstOrFail();

        return view('public.cfp', compact('conference'));
    }

    public function submit(string $slug)
    {
        $conference = Conference::where('slug', $slug)
            ->where('is_active', true)
            ->with('tracks')
            ->firstOrFail();

        return view('public.submit', compact('conference'));
    }

    public function track()
    {
        return view('public.track');
    }
}
