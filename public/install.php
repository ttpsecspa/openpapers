<?php
/**
 * OpenPapers WordPress-like Installer
 *
 * Self-contained installer that configures the database, creates .env,
 * runs migrations, and sets up the superadmin account.
 * Delete this file after installation for security.
 */

// Prevent running if already installed
$basePath = dirname(__DIR__);
$envFile = $basePath . '/.env';
$lockFile = $basePath . '/storage/installed.lock';

if (file_exists($lockFile)) {
    die('<!DOCTYPE html><html><head><title>OpenPapers</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0f1a;color:#e2e8f0">
        <h1>OpenPapers ya está instalado</h1>
        <p>Si necesitas reinstalar, elimina el archivo <code>storage/installed.lock</code></p>
        <a href="/" style="color:#818cf8">Ir al inicio</a>
    </body></html>');
}

// Check PHP version
if (version_compare(PHP_VERSION, '8.2.0', '<')) {
    die('<!DOCTYPE html><html><head><title>OpenPapers</title></head><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0f1a;color:#e2e8f0">
        <h1>PHP 8.2+ requerido</h1>
        <p>Tu versión actual es: ' . htmlspecialchars(PHP_VERSION, ENT_QUOTES, 'UTF-8') . '</p>
    </body></html>');
}

$errors = [];
$success = false;
$step = isset($_POST['step']) ? (int)$_POST['step'] : 1;

// Step 2: Process installation
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $step === 2) {
    // CSRF check
    if (!isset($_POST['_token']) || !isset($_SESSION['_installer_token']) || !hash_equals($_SESSION['_installer_token'], $_POST['_token'])) {
        // Start session for CSRF if not started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (!isset($_POST['_token']) || !isset($_SESSION['_installer_token']) || !hash_equals($_SESSION['_installer_token'], $_POST['_token'])) {
            $errors[] = 'Token CSRF inválido. Recarga la página e intenta de nuevo.';
            $step = 1;
        }
    }

    if (empty($errors)) {
        // Sanitize inputs
        $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
        $dbPort = trim($_POST['db_port'] ?? '3306');
        $dbName = trim($_POST['db_name'] ?? 'openpapers');
        $dbUser = trim($_POST['db_user'] ?? 'root');
        $dbPass = $_POST['db_pass'] ?? '';
        $appUrl = rtrim(trim($_POST['app_url'] ?? ''), '/');
        $appName = trim($_POST['app_name'] ?? 'OpenPapers');
        $adminEmail = trim($_POST['admin_email'] ?? '');
        $adminPassword = $_POST['admin_password'] ?? '';
        $adminName = trim($_POST['admin_name'] ?? 'Administrador');
        $smtpHost = trim($_POST['smtp_host'] ?? '');
        $smtpPort = trim($_POST['smtp_port'] ?? '587');
        $smtpUser = trim($_POST['smtp_user'] ?? '');
        $smtpPass = $_POST['smtp_pass'] ?? '';
        $smtpFrom = trim($_POST['smtp_from'] ?? '');

        // Validate
        if (empty($dbHost)) $errors[] = 'El host de la base de datos es requerido';
        if (empty($dbName)) $errors[] = 'El nombre de la base de datos es requerido';
        if (empty($dbUser)) $errors[] = 'El usuario de la base de datos es requerido';
        if (!filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'El email del administrador no es válido';
        if (strlen($adminPassword) < 8) $errors[] = 'La contraseña debe tener al menos 8 caracteres';
        if (!preg_match('/[A-Z]/', $adminPassword)) $errors[] = 'La contraseña debe tener al menos una mayúscula';
        if (!preg_match('/[a-z]/', $adminPassword)) $errors[] = 'La contraseña debe tener al menos una minúscula';
        if (!preg_match('/[0-9]/', $adminPassword)) $errors[] = 'La contraseña debe tener al menos un número';
        if (empty($appUrl)) $errors[] = 'La URL de la aplicación es requerida';

        // Test DB connection
        if (empty($errors)) {
            try {
                $dsn = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
                $pdo = new PDO($dsn, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_TIMEOUT => 5,
                ]);

                // Create database if not exists
                $safeName = preg_replace('/[^a-zA-Z0-9_]/', '', $dbName);
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$safeName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                $pdo->exec("USE `{$safeName}`");
            } catch (PDOException $e) {
                $errors[] = 'Error de conexión a la base de datos: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
            }
        }

        if (empty($errors)) {
            // Generate APP_KEY
            $appKey = 'base64:' . base64_encode(random_bytes(32));

            // Check if HTTPS
            $isSecure = (
                (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
                (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
                str_starts_with($appUrl, 'https')
            );

            // Write .env
            $envContent = "APP_NAME=\"{$appName}\"\n";
            $envContent .= "APP_ENV=production\n";
            $envContent .= "APP_KEY={$appKey}\n";
            $envContent .= "APP_DEBUG=false\n";
            $envContent .= "APP_TIMEZONE=UTC\n";
            $envContent .= "APP_URL={$appUrl}\n\n";

            $envContent .= "APP_LOCALE=es\n";
            $envContent .= "APP_FALLBACK_LOCALE=en\n";
            $envContent .= "APP_FAKER_LOCALE=es_ES\n\n";

            $envContent .= "APP_MAINTENANCE_DRIVER=file\n\n";

            $envContent .= "BCRYPT_ROUNDS=12\n\n";

            $envContent .= "LOG_CHANNEL=stack\n";
            $envContent .= "LOG_STACK=single\n";
            $envContent .= "LOG_DEPRECATIONS_CHANNEL=null\n";
            $envContent .= "LOG_LEVEL=error\n\n";

            $envContent .= "DB_CONNECTION=mysql\n";
            $envContent .= "DB_HOST={$dbHost}\n";
            $envContent .= "DB_PORT={$dbPort}\n";
            $envContent .= "DB_DATABASE={$safeName}\n";
            $envContent .= "DB_USERNAME={$dbUser}\n";
            $envContent .= "DB_PASSWORD=\"{$dbPass}\"\n\n";

            $envContent .= "SESSION_DRIVER=database\n";
            $envContent .= "SESSION_LIFETIME=120\n";
            $envContent .= "SESSION_ENCRYPT=true\n";
            $envContent .= "SESSION_PATH=/\n";
            $envContent .= "SESSION_DOMAIN=null\n";
            $envContent .= "SESSION_SECURE_COOKIE=" . ($isSecure ? 'true' : 'false') . "\n";
            $envContent .= "SESSION_SAME_SITE=strict\n\n";

            $envContent .= "FILESYSTEM_DISK=local\n";
            $envContent .= "QUEUE_CONNECTION=sync\n\n";

            $envContent .= "CACHE_STORE=database\n";
            $envContent .= "CACHE_PREFIX=openpapers_\n\n";

            $envContent .= "MAIL_MAILER=smtp\n";
            $envContent .= "MAIL_HOST={$smtpHost}\n";
            $envContent .= "MAIL_PORT={$smtpPort}\n";
            $envContent .= "MAIL_USERNAME=\"{$smtpUser}\"\n";
            $envContent .= "MAIL_PASSWORD=\"{$smtpPass}\"\n";
            $envContent .= "MAIL_ENCRYPTION=tls\n";
            $envContent .= "MAIL_FROM_ADDRESS=\"" . ($smtpFrom ?: $adminEmail) . "\"\n";
            $envContent .= "MAIL_FROM_NAME=\"\${APP_NAME}\"\n\n";

            $envContent .= "# OpenPapers specific\n";
            $envContent .= "ADMIN_EMAIL={$adminEmail}\n";
            $envContent .= "ADMIN_PASSWORD=\"{$adminPassword}\"\n";
            $envContent .= "ADMIN_NAME=\"{$adminName}\"\n";
            $envContent .= "MAX_FILE_SIZE_MB=10\n";
            $envContent .= "MIN_REVIEWERS=2\n";

            // Write .env file
            if (file_put_contents($envFile, $envContent) === false) {
                $errors[] = 'No se pudo escribir el archivo .env. Verifica los permisos de escritura.';
            }

            // Check storage directories are writable
            $storageDirs = [
                $basePath . '/storage/app',
                $basePath . '/storage/framework/cache',
                $basePath . '/storage/framework/sessions',
                $basePath . '/storage/framework/views',
                $basePath . '/storage/logs',
                $basePath . '/bootstrap/cache',
            ];

            foreach ($storageDirs as $dir) {
                if (!is_dir($dir)) {
                    @mkdir($dir, 0755, true);
                }
                if (!is_writable($dir)) {
                    $errors[] = "El directorio {$dir} no tiene permisos de escritura.";
                }
            }
        }

        // Run migrations via Artisan
        if (empty($errors)) {
            try {
                // Bootstrap Laravel
                $app = require $basePath . '/bootstrap/app.php';
                $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
                $kernel->bootstrap();

                // Clear config cache to pick up new .env
                \Illuminate\Support\Facades\Artisan::call('config:clear');

                // Run migrations
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

                // Seed superadmin
                \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);

                // Create storage link
                if (!file_exists($basePath . '/public/storage')) {
                    \Illuminate\Support\Facades\Artisan::call('storage:link');
                }

                // Optimize for production
                \Illuminate\Support\Facades\Artisan::call('config:cache');
                \Illuminate\Support\Facades\Artisan::call('route:cache');
                \Illuminate\Support\Facades\Artisan::call('view:cache');

                // Write lock file
                file_put_contents($lockFile, json_encode([
                    'installed_at' => date('c'),
                    'php_version' => PHP_VERSION,
                    'installer_ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                ]));

                $success = true;

            } catch (\Throwable $e) {
                $errors[] = 'Error durante la migración: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
                // Clean up .env on failure
                if (file_exists($envFile) && !file_exists($lockFile)) {
                    @unlink($envFile);
                }
            }
        }

        if (!empty($errors)) {
            $step = 1;
        }
    }
}

// Generate CSRF token
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['_installer_token'])) {
    $_SESSION['_installer_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['_installer_token'];

// System checks
$checks = [
    'PHP 8.2+' => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL' => extension_loaded('pdo_mysql'),
    'Mbstring' => extension_loaded('mbstring'),
    'OpenSSL' => extension_loaded('openssl'),
    'Tokenizer' => extension_loaded('tokenizer'),
    'JSON' => extension_loaded('json'),
    'cURL' => extension_loaded('curl'),
    'Fileinfo' => extension_loaded('fileinfo'),
    'storage/ writable' => is_writable($basePath . '/storage'),
    'bootstrap/cache/ writable' => is_writable($basePath . '/bootstrap/cache'),
];

// Auto-detect URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$path = dirname($_SERVER['SCRIPT_NAME']);
$detectedUrl = $protocol . '://' . $host . ($path !== '/' && $path !== '\\' ? $path : '');
$detectedUrl = rtrim(str_replace('/install.php', '', $detectedUrl), '/');

?><!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>OpenPapers — Instalación</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        dark: { 900: '#0a0f1a', 800: '#111827', 700: '#1e2a3a', 600: '#2d3a4a' },
                        accent: { 500: '#6366f1', 400: '#818cf8', 300: '#a5b4fc' }
                    }
                }
            }
        }
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>body { font-family: 'Outfit', sans-serif; }</style>
</head>
<body class="bg-dark-900 text-gray-200 min-h-screen">
    <div class="max-w-2xl mx-auto px-4 py-12">
        <!-- Header -->
        <div class="text-center mb-10">
            <h1 class="text-3xl font-bold text-white mb-2">OpenPapers</h1>
            <p class="text-gray-400">Instalación del sistema</p>
        </div>

        <?php if ($success): ?>
        <!-- Success -->
        <div class="bg-dark-800 border border-green-500/30 rounded-xl p-8 text-center">
            <div class="text-5xl mb-4">✅</div>
            <h2 class="text-2xl font-bold text-white mb-3">¡Instalación completada!</h2>
            <p class="text-gray-400 mb-6">OpenPapers se ha instalado correctamente. Por seguridad, <strong class="text-red-400">elimina el archivo <code>public/install.php</code></strong> de tu servidor.</p>
            <div class="bg-dark-700 rounded-lg p-4 mb-6 text-left text-sm">
                <p class="text-gray-400 mb-1">Credenciales de administrador:</p>
                <p class="text-white">Email: <strong><?= htmlspecialchars($adminEmail, ENT_QUOTES, 'UTF-8') ?></strong></p>
                <p class="text-white">Contraseña: <em class="text-gray-500">(la que configuraste)</em></p>
            </div>
            <div class="flex gap-3 justify-center">
                <a href="/" class="px-6 py-2.5 bg-accent-500 hover:bg-accent-400 text-white rounded-lg font-medium transition">Ir al inicio</a>
                <a href="/login" class="px-6 py-2.5 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-medium transition">Iniciar sesión</a>
            </div>
        </div>

        <?php else: ?>
        <!-- Errors -->
        <?php if (!empty($errors)): ?>
        <div class="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <h3 class="text-red-400 font-semibold mb-2">Errores encontrados:</h3>
            <ul class="text-sm text-red-300 space-y-1">
                <?php foreach ($errors as $error): ?>
                <li>• <?= $error ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>

        <!-- System Checks -->
        <div class="bg-dark-800 border border-dark-600 rounded-xl p-6 mb-6">
            <h2 class="text-lg font-semibold text-white mb-4">Requisitos del sistema</h2>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <?php foreach ($checks as $name => $ok): ?>
                <div class="flex items-center gap-2">
                    <span class="<?= $ok ? 'text-green-400' : 'text-red-400' ?>"><?= $ok ? '✓' : '✗' ?></span>
                    <span class="<?= $ok ? 'text-gray-300' : 'text-red-300' ?>"><?= htmlspecialchars($name, ENT_QUOTES, 'UTF-8') ?></span>
                </div>
                <?php endforeach; ?>
            </div>
            <?php if (in_array(false, $checks, true)): ?>
            <p class="text-red-400 text-sm mt-3">Algunos requisitos no se cumplen. Corrígelos antes de continuar.</p>
            <?php endif; ?>
        </div>

        <!-- Installation Form -->
        <form method="POST" class="space-y-6">
            <input type="hidden" name="step" value="2">
            <input type="hidden" name="_token" value="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>">

            <!-- Database -->
            <div class="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-white mb-4">Base de datos MariaDB/MySQL</h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Host</label>
                        <input type="text" name="db_host" value="<?= htmlspecialchars($_POST['db_host'] ?? '127.0.0.1', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Puerto</label>
                        <input type="text" name="db_port" value="<?= htmlspecialchars($_POST['db_port'] ?? '3306', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Nombre de la BD</label>
                        <input type="text" name="db_name" value="<?= htmlspecialchars($_POST['db_name'] ?? 'openpapers', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Usuario</label>
                        <input type="text" name="db_user" value="<?= htmlspecialchars($_POST['db_user'] ?? 'root', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm text-gray-400 mb-1">Contraseña</label>
                        <input type="password" name="db_pass" value="<?= htmlspecialchars($_POST['db_pass'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none">
                    </div>
                </div>
            </div>

            <!-- Application -->
            <div class="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-white mb-4">Aplicación</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Nombre del sitio</label>
                        <input type="text" name="app_name" value="<?= htmlspecialchars($_POST['app_name'] ?? 'OpenPapers', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">URL del sitio</label>
                        <input type="url" name="app_url" value="<?= htmlspecialchars($_POST['app_url'] ?? $detectedUrl, ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                        <p class="text-xs text-gray-500 mt-1">Sin barra final. Ej: https://midominio.com</p>
                    </div>
                </div>
            </div>

            <!-- Admin Account -->
            <div class="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-white mb-4">Cuenta de administrador</h2>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Nombre completo</label>
                        <input type="text" name="admin_name" value="<?= htmlspecialchars($_POST['admin_name'] ?? 'Administrador', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Email</label>
                        <input type="email" name="admin_email" value="<?= htmlspecialchars($_POST['admin_email'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required>
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Contraseña</label>
                        <input type="password" name="admin_password"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" required minlength="8">
                        <p class="text-xs text-gray-500 mt-1">Mínimo 8 caracteres, con mayúscula, minúscula y número</p>
                    </div>
                </div>
            </div>

            <!-- SMTP (Optional) -->
            <div class="bg-dark-800 border border-dark-600 rounded-xl p-6">
                <h2 class="text-lg font-semibold text-white mb-4">Correo SMTP <span class="text-gray-500 text-sm font-normal">(opcional)</span></h2>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Servidor SMTP</label>
                        <input type="text" name="smtp_host" value="<?= htmlspecialchars($_POST['smtp_host'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" placeholder="smtp.gmail.com">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Puerto</label>
                        <input type="text" name="smtp_port" value="<?= htmlspecialchars($_POST['smtp_port'] ?? '587', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Usuario SMTP</label>
                        <input type="text" name="smtp_user" value="<?= htmlspecialchars($_POST['smtp_user'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Contraseña SMTP</label>
                        <input type="password" name="smtp_pass" value="<?= htmlspecialchars($_POST['smtp_pass'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none">
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm text-gray-400 mb-1">Email remitente</label>
                        <input type="email" name="smtp_from" value="<?= htmlspecialchars($_POST['smtp_from'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                            class="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:border-accent-500 focus:outline-none" placeholder="noreply@midominio.com">
                    </div>
                </div>
            </div>

            <!-- Submit -->
            <button type="submit" <?= in_array(false, $checks, true) ? 'disabled' : '' ?>
                class="w-full py-3 bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition">
                Instalar OpenPapers
            </button>
        </form>
        <?php endif; ?>

        <p class="text-center text-gray-600 text-sm mt-8">OpenPapers © <?= date('Y') ?></p>
    </div>
</body>
</html>
