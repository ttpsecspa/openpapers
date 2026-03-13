<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update settings (CWE-915: Mass assignment protection via whitelist).
     */
    public function update(Request $request): JsonResponse
    {
        $allowed = config('openpapers.allowed_settings', []);
        $data = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($data['settings'] as $key => $value) {
            if (in_array($key, $allowed, true)) {
                Setting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
            }
        }

        return response()->json(['message' => 'Configuración actualizada']);
    }
}
