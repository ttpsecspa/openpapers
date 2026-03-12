<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public $timestamps = false;
    public $incrementing = false;

    protected $primaryKey = 'key';
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    /**
     * Get a setting value by key (CWE-915: only allowed keys).
     */
    public static function get(string $key, $default = null): ?string
    {
        $setting = static::find($key);
        return $setting?->value ?? $default;
    }

    /**
     * Set a setting value (CWE-915: validates against whitelist).
     */
    public static function set(string $key, string $value): void
    {
        $allowed = config('openpapers.allowed_settings', []);
        if (! in_array($key, $allowed, true)) {
            throw new \InvalidArgumentException("Setting '{$key}' is not allowed");
        }

        static::updateOrCreate(['key' => $key], ['value' => $value]);
    }
}
