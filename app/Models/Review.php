<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'submission_id', 'reviewer_id', 'overall_score', 'originality_score',
        'technical_score', 'clarity_score', 'relevance_score', 'recommendation',
        'comments_to_authors', 'comments_to_chairs', 'confidence', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'overall_score' => 'integer',
            'originality_score' => 'integer',
            'technical_score' => 'integer',
            'clarity_score' => 'integer',
            'relevance_score' => 'integer',
            'confidence' => 'integer',
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
