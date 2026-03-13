<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conference extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'edition', 'description', 'logo_url', 'website_url',
        'location', 'start_date', 'end_date', 'submission_deadline',
        'notification_date', 'camera_ready_date', 'is_active', 'is_double_blind',
        'min_reviewers', 'max_file_size_mb', 'custom_fields',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_double_blind' => 'boolean',
            'custom_fields' => 'array',
            'start_date' => 'date',
            'end_date' => 'date',
            'submission_deadline' => 'date',
            'notification_date' => 'date',
            'camera_ready_date' => 'date',
        ];
    }

    public function tracks(): HasMany
    {
        return $this->hasMany(Track::class)->orderBy('sort_order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ConferenceMember::class);
    }

    /**
     * Scope: only conferences visible to admin user (CWE-863).
     */
    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isSuperAdmin()) {
            return $query;
        }

        return $query->whereIn('id', $user->conferenceIds());
    }
}
