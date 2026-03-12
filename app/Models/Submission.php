<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    protected $fillable = [
        'conference_id', 'tracking_code', 'title', 'authors_json', 'abstract',
        'keywords', 'track_id', 'file_path', 'file_original_name', 'status',
        'decision_notes', 'submitted_by_email',
    ];

    protected function casts(): array
    {
        return [
            'authors_json' => 'array',
        ];
    }

    public function conference(): BelongsTo
    {
        return $this->belongsTo(Conference::class);
    }

    public function track(): BelongsTo
    {
        return $this->belongsTo(Track::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ReviewAssignment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Scope: submissions visible to a given user based on role (CWE-863).
     */
    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        if ($user->role === 'admin') {
            return $query->whereIn('conference_id', $user->conferenceIds());
        }

        if ($user->role === 'reviewer') {
            return $query->whereHas('assignments', function ($q) use ($user) {
                $q->where('reviewer_id', $user->id);
            });
        }

        return $query->where('submitted_by_email', $user->email);
    }

    /**
     * Get author emails from authors_json for conflict checking.
     */
    public function authorEmails(): array
    {
        $authors = $this->authors_json ?? [];
        return array_filter(array_map(fn($a) => $a['email'] ?? null, $authors));
    }
}
