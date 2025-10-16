<?php
/**
 * PHP Development Server Router
 * This script handles routing for the PHP API in the Replit environment
 */

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse the URI
$uri = parse_url($requestUri, PHP_URL_PATH);

// Remove leading slash
$uri = ltrim($uri, '/');

// Set CORS headers for all requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS requests
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Route API requests
if (str_starts_with($uri, 'api/')) {
    // Extract the endpoint from the URI
    $endpoint = substr($uri, 4); // Remove 'api/' prefix
    
    // Get the base resource (first segment after 'api/')
    $segments = explode('/', $endpoint);
    $resource = $segments[0];
    
    // Controller-based endpoints (use api/index.php for RESTful routing)
    $controllerEndpoints = ['vendors', 'licenses', 'clients', 'auth'];
    
    // Map standalone endpoints to PHP files (supporting both hyphen and underscore)
    $routes = [
        'currencies' => __DIR__ . '/api/currencies.php',
        'login' => __DIR__ . '/api/login.php',
        'license_notifications' => __DIR__ . '/api/license_notifications.php',
        'notification_settings' => __DIR__ . '/api/notification_settings.php',
        'notification-settings' => __DIR__ . '/api/notification_settings.php', // Support hyphenated version
        'notificationmail' => __DIR__ . '/api/notificationmail.php',
        'test_email' => __DIR__ . '/api/test_email.php',
        'test-smtp' => __DIR__ . '/api/test-smtp.php',
    ];
    
    // Remove .php extension if present
    $resource = str_replace('.php', '', $resource);
    
    // Route controller-based endpoints to api/index.php
    if (in_array($resource, $controllerEndpoints)) {
        require __DIR__ . '/api/index.php';
        exit;
    }
    // Route standalone endpoints to their respective files
    elseif (isset($routes[$resource]) && file_exists($routes[$resource])) {
        require $routes[$resource];
        exit;
    }
    // API index/health check
    elseif ($endpoint === '' || $endpoint === 'index.php') {
        require __DIR__ . '/api/index.php';
        exit;
    }
    // Check for notifications sub-endpoints
    elseif ($resource === 'notifications') {
        require __DIR__ . '/api/index.php';
        exit;
    }
    // Try to find a matching standalone PHP file with underscore conversion
    else {
        $phpFile = __DIR__ . '/api/' . str_replace('-', '_', $resource) . '.php';
        if (file_exists($phpFile)) {
            require $phpFile;
            exit;
        }
        
        // Endpoint not found
        header('Content-Type: application/json');
        http_response_code(404);
        $availableEndpoints = array_merge(array_keys($routes), $controllerEndpoints);
        echo json_encode([
            'error' => 'Endpoint not found',
            'requested' => $resource,
            'available_endpoints' => $availableEndpoints
        ]);
        exit;
    }
}

// If not an API request, serve static files or return 404
if (file_exists(__DIR__ . '/' . $uri)) {
    return false; // Let PHP's built-in server handle it
} else {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'Not found', 'uri' => $uri]);
    exit;
}
