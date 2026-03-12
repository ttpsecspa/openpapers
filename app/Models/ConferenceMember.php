<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConferenceMember extends Model
{
    public $timestamps = false;

    protected $fillable = ['conference_id', 'user_id', 'role', 'tracks'];

    protected function casts(): array
    {
        return [
            'tracks' => 'array',
        ];
    }

    public function conference(): BelongsTo
    {
        return $this->belongsTo(Conference::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
