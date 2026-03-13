<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conference_id')->constrained();
            $table->string('tracking_code')->unique();
            $table->string('title');
            $table->json('authors_json');
            $table->text('abstract');
            $table->string('keywords')->nullable();
            $table->foreignId('track_id')->nullable()->constrained('tracks');
            $table->string('file_path')->nullable();
            $table->string('file_original_name')->nullable();
            $table->enum('status', [
                'submitted', 'under_review', 'accepted', 'rejected',
                'revision_requested', 'withdrawn', 'camera_ready',
            ])->default('submitted');
            $table->text('decision_notes')->nullable();
            $table->string('submitted_by_email');
            $table->timestamps();

            $table->index('conference_id');
            $table->index('status');
        });

        Schema::create('review_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users');
            $table->timestamp('assigned_at')->useCurrent();
            $table->date('deadline')->nullable();
            $table->enum('status', ['pending', 'completed', 'declined'])->default('pending');
            $table->unique(['submission_id', 'reviewer_id']);
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reviewer_id')->constrained('users');
            $table->unsignedTinyInteger('overall_score'); // 1-10
            $table->unsignedTinyInteger('originality_score')->nullable(); // 1-10
            $table->unsignedTinyInteger('technical_score')->nullable(); // 1-10
            $table->unsignedTinyInteger('clarity_score')->nullable(); // 1-10
            $table->unsignedTinyInteger('relevance_score')->nullable(); // 1-10
            $table->enum('recommendation', [
                'strong_accept', 'accept', 'weak_accept',
                'weak_reject', 'reject', 'strong_reject',
            ]);
            $table->text('comments_to_authors');
            $table->text('comments_to_chairs')->nullable();
            $table->unsignedTinyInteger('confidence')->nullable(); // 1-5
            $table->timestamp('submitted_at')->useCurrent();
            $table->unique(['submission_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('review_assignments');
        Schema::dropIfExists('submissions');
    }
};
