<?php

namespace App\Services;

use App\Models\EmailLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailerService
{
    /**
     * Send email using a template with placeholder replacement.
     * CWE-79: All values are HTML-escaped before insertion.
     */
    public function send(string $to, string $template, array $vars, ?int $conferenceId = null): bool
    {
        try {
            $html = $this->renderTemplate($template, $vars);
            $subject = $this->getSubject($template, $vars);

            Mail::html($html, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });

            EmailLog::create([
                'conference_id' => $conferenceId,
                'to_email' => $to,
                'subject' => $subject,
                'template' => $template,
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Email send failed: {$e->getMessage()}", [
                'to' => $to, 'template' => $template,
            ]);

            EmailLog::create([
                'conference_id' => $conferenceId,
                'to_email' => $to,
                'subject' => $this->getSubject($template, $vars),
                'template' => $template,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);

            return false;
        }
    }

    public function sendSubmissionConfirmation(string $to, array $vars, int $conferenceId): bool
    {
        return $this->send($to, 'submission_confirmation', $vars, $conferenceId);
    }

    public function sendReviewAssignment(string $to, array $vars, int $conferenceId): bool
    {
        return $this->send($to, 'review_assignment', $vars, $conferenceId);
    }

    public function sendDecisionAccepted(string $to, array $vars, int $conferenceId): bool
    {
        return $this->send($to, 'decision_accepted', $vars, $conferenceId);
    }

    public function sendDecisionRejected(string $to, array $vars, int $conferenceId): bool
    {
        return $this->send($to, 'decision_rejected', $vars, $conferenceId);
    }

    public function sendDecisionRevision(string $to, array $vars, int $conferenceId): bool
    {
        return $this->send($to, 'decision_revision', $vars, $conferenceId);
    }

    private function renderTemplate(string $name, array $vars): string
    {
        $path = resource_path("views/emails/{$name}.blade.php");

        if (! file_exists($path)) {
            // Fallback to HTML templates
            $htmlPath = resource_path("templates/email/{$name}.html");
            if (file_exists($htmlPath)) {
                $html = file_get_contents($htmlPath);
                // Replace {{key}} placeholders with escaped values
                foreach ($vars as $key => $value) {
                    $html = str_replace("{{{$key}}}", e($value), $html);
                }
                $appUrl = config('app.url', 'http://localhost');
                $html = str_replace('{{appUrl}}', e($appUrl), $html);
                return $html;
            }
        }

        // Use Blade view if available
        return view("emails.{$name}", $vars)->render();
    }

    private function getSubject(string $template, array $vars): string
    {
        $conferenceName = $vars['conferenceName'] ?? 'OpenPapers';

        return match ($template) {
            'submission_confirmation' => "[{$conferenceName}] Confirmación de envío",
            'review_assignment' => "[{$conferenceName}] Asignación de revisión",
            'review_reminder' => "[{$conferenceName}] Recordatorio de revisión",
            'decision_accepted' => "[{$conferenceName}] Decisión: Aceptado",
            'decision_rejected' => "[{$conferenceName}] Decisión: Rechazado",
            'decision_revision' => "[{$conferenceName}] Decisión: Revisión solicitada",
            default => "[{$conferenceName}] Notificación",
        };
    }
}
