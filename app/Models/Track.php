<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Track extends Model
{
    public $timestamps = false;

    protected $fillable = ['conference_id', 'name', 'description', 'sort_order'];

    public function conference(): BelongsTo
    {
        return $this->belongsTo(Conference::class);
    }
}
