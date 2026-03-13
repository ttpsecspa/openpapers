<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReviewAssignment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'submission_id', 'reviewer_id', 'assigned_at', 'deadline', 'status',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'deadline' => 'date',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
