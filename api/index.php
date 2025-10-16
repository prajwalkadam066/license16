<?php
/**
 * Main API Entry Point
 */

header("Content-Type: application/json; charset=UTF-8");

// Include constants first
require_once __DIR__ . '/config/constants.php';

// Error reporting - only in development, defaults to production (safe)
$isDevelopment = (defined('APP_ENV') && APP_ENV === 'development');
if ($isDevelopment) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
require_once __DIR__ . '/middleware/CORS.php';
require_once __DIR__ . '/utils/Response.php';

// Set CORS headers
CORS::handle();

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Remove base path if present - handle both direct access and nested paths
if (strpos($uri, '/License/api/index.php') === 0) {
    $uri = substr($uri, strlen('/License/api/index.php'));
} elseif (strpos($uri, '/License/api') === 0) {
    $uri = substr($uri, strlen('/License/api'));
} elseif (strpos($uri, '/lms/api/index.php') === 0) {
    $uri = substr($uri, strlen('/lms/api/index.php'));
} elseif (strpos($uri, '/lms/api') === 0) {
    $uri = substr($uri, strlen('/lms/api'));
} elseif (strpos($uri, '/api/index.php') === 0) {
    $uri = substr($uri, strlen('/api/index.php'));
} elseif (strpos($uri, '/api') === 0) {
    $uri = substr($uri, strlen('/api'));
}

// Parse URI segments
$segments = array_filter(explode('/', $uri));
$segments = array_values($segments);

// Health check endpoint - when no segments or accessing index.php directly
if ((empty($segments) || (count($segments) == 1 && $segments[0] == 'index.php')) && $method === 'GET') {
    Response::success(['status' => 'OK', 'timestamp' => date('c')], 'API is running');
}

// Route requests
try {
    if (count($segments) === 0) {
        Response::notFound('Endpoint not found');
    }
    
    $resource = $segments[0];
    $id = isset($segments[1]) ? $segments[1] : null;
    $action = isset($segments[2]) ? $segments[2] : null;
    
    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/controllers/AuthController.php';
            $controller = new AuthController();
            
            switch ($id) {
                case 'login':
                    $controller->login();
                    break;
                case 'register':
                    $controller->register();
                    break;
                case 'me':
                    $controller->me();
                    break;
                case 'status':
                    $controller->status();
                    break;
                case 'change-password':
                    $controller->changePassword();
                    break;
                default:
                    Response::notFound('Auth endpoint not found');
            }
            break;
            
        case 'licenses':
            require_once __DIR__ . '/controllers/LicenseController.php';
            $controller = new LicenseController();
            
            if ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('License endpoint not found');
            }
            break;
            
        case 'clients':
            require_once __DIR__ . '/controllers/ClientController.php';
            $controller = new ClientController();
            
            if ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('Client endpoint not found');
            }
            break;
            
        case 'vendors':
            require_once __DIR__ . '/controllers/VendorsController.php';
            $controller = new VendorsController();
            
            if ($method === 'GET' && !$id) {
                $controller->index();
            } elseif ($method === 'GET' && $id) {
                $controller->show($id);
            } elseif ($method === 'POST') {
                $controller->store();
            } elseif ($method === 'PUT' && $id) {
                $controller->update($id);
            } elseif ($method === 'DELETE' && $id) {
                $controller->destroy($id);
            } else {
                Response::notFound('Vendor endpoint not found');
            }
            break;
            
        case 'currencies':
            require __DIR__ . '/currencies.php';
            exit;
            
        case 'notification-settings':
            require __DIR__ . '/notification_settings.php';
            exit;
            
        case 'notifications':
            if ($id === 'history' || $id === 'check-expiring-licenses') {
                require __DIR__ . '/license_notifications.php';
                exit;
            }
            Response::notFound('Notification endpoint not found');
            break;
            
        case 'login':
            require __DIR__ . '/login.php';
            exit;
            
        case 'test-smtp':
        case 'test_email':
            require __DIR__ . '/test-smtp.php';
            exit;
            
        case 'notificationmail':
            require __DIR__ . '/notificationmail.php';
            exit;
            
        default:
            // Try to find a matching standalone PHP file before returning 404
            $phpFile = __DIR__ . '/' . str_replace('-', '_', $resource) . '.php';
            if (file_exists($phpFile)) {
                require $phpFile;
                exit;
            }
            
            Response::notFound('Resource not found');
    }
} catch (Exception $e) {
    // Log the actual error for debugging
    error_log("API Error: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine());
    
    // Return generic error message in production, detailed in development  
    if ($isDevelopment) {
        Response::error('Internal server error: ' . $e->getMessage());
    } else {
        Response::error('Internal server error');
    }
}
?>