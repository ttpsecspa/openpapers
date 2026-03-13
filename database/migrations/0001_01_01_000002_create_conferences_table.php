<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conferences', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('edition')->nullable();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('website_url')->nullable();
            $table->string('location')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('submission_deadline');
            $table->date('notification_date')->nullable();
            $table->date('camera_ready_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_double_blind')->default(true);
            $table->unsignedTinyInteger('min_reviewers')->default(2);
            $table->unsignedTinyInteger('max_file_size_mb')->default(10);
            $table->json('custom_fields')->nullable();
            $table->timestamps();
        });

        Schema::create('tracks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conference_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
        });

        Schema::create('conference_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conference_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['chair', 'reviewer'])->default('reviewer');
            $table->json('tracks')->nullable();
            $table->unique(['conference_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conference_members');
        Schema::dropIfExists('tracks');
        Schema::dropIfExists('conferences');
    }
};
