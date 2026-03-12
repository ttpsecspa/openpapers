<?php

return [
    'admin' => [
        'email' => env('ADMIN_EMAIL', 'admin@openpapers.local'),
        'password' => env('ADMIN_PASSWORD', ''),
        'name' => env('ADMIN_NAME', 'Administrador'),
    ],

    'max_file_size_mb' => (int) env('MAX_FILE_SIZE_MB', 10),
    'min_reviewers' => (int) env('MIN_REVIEWERS', 2),

    'allowed_settings' => [
        'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure',
        'smtp_from_name', 'smtp_from_email', 'app_name', 'app_url', 'max_file_size_mb',
    ],

    'statuses' => [
        'submitted', 'under_review', 'accepted', 'rejected',
        'revision_requested', 'withdrawn', 'camera_ready',
    ],

    'recommendations' => [
        'strong_accept', 'accept', 'weak_accept',
        'weak_reject', 'reject', 'strong_reject',
    ],

    'roles' => ['superadmin', 'admin', 'reviewer', 'author'],
    'conference_roles' => ['chair', 'reviewer'],
];
