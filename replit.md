# Overview

LicenseHub is an enterprise software license management system designed to track, monitor, and manage software licenses efficiently. It offers features like automated expiry notifications, multi-currency cost tracking, client management, and detailed reporting. The system aims to centralize software procurement, renewal cycles, and compliance tracking to streamline operations and enhance regulatory adherence.

# Recent Changes

**October 16, 2025** - Completed PAN to GST Migration:
- ✅ Migrated database schema from 'pan' (10-char) to 'gst' (15-char) columns across clients, vendors, and license_purchases tables
- ✅ Updated all Node.js backend APIs (server/index.ts) to use 'gst' field in INSERT, UPDATE, and SELECT queries
- ✅ Updated all PHP backend APIs (api/licenses.php, api/clients.php) to use 'gst' field
- ✅ Updated PHP controllers (VendorsController.php, ClientController.php) for 'gst' field handling
- ✅ Updated frontend components (Clients.tsx) to display "GST Number" labels instead of "PAN"
- ✅ Updated AddLicenseModal component with 15-character GST Number input field
- ✅ Fixed notification settings error - removed reference to non-existent notification_time column
- ✅ All create, update, and display operations now use GST Number format throughout the application

**October 15, 2025** - Fixed cPanel Vendor Page 404 and 500 Errors:
- ✅ Resolved 404 "Not Found" errors for vendor page on cPanel deployment
- ✅ Fixed "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" error
- ✅ Resolved 500 "Internal server error" by fixing `/License/api/` path handling in `api/index.php`
- ✅ Fixed critical 500 error caused by JWT_SECRET check in `api/config/constants.php` - removed production check since JWT isn't used (session-based auth is used instead)
- ✅ Updated `api/.htaccess` to route all API requests through `index.php` router
- ✅ Modified `cpanel.htaccess` to let the API folder handle its own routing
- ✅ Fixed API endpoint routing - now properly uses controller pattern instead of looking for individual PHP files
- ✅ Added path prefix handling for `/License/api/` URLs in router (previously only handled `/lms/api/` and `/api/`)
- ✅ Created comprehensive deployment guide (CPANEL_VENDOR_FIX.md) with clear instructions
- ✅ All API endpoints (vendors, clients, licenses, currencies, notification-settings) now work correctly on cPanel

**October 15, 2025** - Fixed Vendor Data Display and Field Issues:
- ✅ Resolved vendor field display issues - GST Treatment and other fields now show correctly
- ✅ Fixed JSON parsing error on cPanel deployment for vendors endpoint
- ✅ Implemented normalizeOptional helper in VendorsController to properly handle empty fields
- ✅ Empty strings are now converted to NULL in the database instead of being stored as empty strings
- ✅ Updated frontend display logic to properly differentiate between NULL and actual empty values
- ✅ Vendor information (Contact Person, Email, Phone, Company, Address, GST Treatment, Source of Supply, GST Number, Payment Mode) now displays correctly

**October 15, 2025** - Fixed Client Data Display and Update Issues:
- ✅ Resolved "Client ID is required" error when updating clients on cPanel deployment
- ✅ Fixed N/A display issue - client data now shows correctly in the table
- ✅ Updated PHP API to extract client ID from URL path (/api/clients/{id}) in addition to request body
- ✅ Modified optional field handling to preserve actual string values instead of converting to NULL
- ✅ Improved frontend display logic to properly differentiate between empty and missing data
- ✅ Client information (Contact Person, Company, Address, GST Treatment, Source of Supply, GST Number) now displays correctly after adding or updating

**October 15, 2025** - Fixed Vendors API Endpoint Errors:
- ✅ Resolved "Endpoint not found" error on Replit and "Unexpected token '<'" error on cPanel
- ✅ Created missing API infrastructure (utils/Response.php, middleware/CORS.php)
- ✅ Built complete controller-based API system with VendorsController
- ✅ Implemented RESTful routing with path-based IDs (/api/vendors/{id})
- ✅ Standardized API responses across all endpoints
- ✅ Fixed environment detection for Replit development mode
- ✅ Vendors endpoint now returns proper JSON: `{"success":true,"message":"Vendors retrieved successfully","data":[]}`

**October 15, 2025** - Fixed Client Name Display Issue:
- ✅ Fixed "No Client" display bug in Licenses table
- ✅ Changed data accessor from `client_name` to `client?.name` to match API response structure
- ✅ Updated setup_mysql_database.sql with complete schema
- ✅ Added 45_days and 7_days notification types to email_notifications table
- ✅ Added all notification day columns (45, 30, 15, 7, 5, 1, 0) to notification_settings table
- ✅ Client names now display correctly throughout the application

**October 15, 2025** - Resolved cPanel Data Fetching Issues:
- ✅ Fixed .htaccess configuration for /License/ subdirectory deployment
- ✅ Updated RewriteBase from `/` to `/License/` for correct routing
- ✅ Fixed API path exclusion from `/api/` to `/License/api/`
- ✅ Created deployment guide (CPANEL_DEPLOYMENT_FIX_GUIDE.md)
- ✅ Data fetching now works correctly on cPanel deployment

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS, supporting dark mode and responsive design.
- **State Management**: React Hooks.
- **Routing**: React Router DOM for SPA navigation.
- **Build Tool**: Vite.
- **Component Structure**: Modular, with reusable components.

## Backend Architecture
- **Runtime**: PHP 8.4.10 for native PHP API support.
- **API Design**: RESTful endpoints with CORS support.
- **Authentication**: Session-based authentication using bcrypt for password hashing.
- **Database Driver**: `mysqli` for cPanel MySQL.
- **Email Notifications**: PHPMailer SMTP integration for automated expiry notifications.

## Data Storage Solutions
- **Primary Database**: MySQL (cPanel hosted).
- **Key Tables**: `users`, `license_purchases`, `clients`, `currencies`, `email_notifications`, `notification_settings`, `vendors`, `tools`, `license_allocations`.

## Authentication & Authorization
- **Authentication**: Email/password with bcrypt hashing.
- **Session Management**: Basic session handling.
- **User Roles**: Supports Admin, Accounts, and User roles with CRUD permission controls.

## Notification System Architecture
- **Email Provider**: PHPMailer SMTP with environment-based credentials.
- **Trigger Points**: Configurable days before license expiry (e.g., 45, 30, 15, 7, 5, 1, 0, expired).
- **Delivery Method**: Rich HTML email notifications with urgency-based color coding.
- **Recipients**: Both admin (via `ADMIN_EMAIL` env var) and client email addresses.
- **Automated Scheduler**: Background service runs daily at user-configured time to check and send notifications.
- **Configuration UI**: Web-based settings interface in NotificationCenter for time and notification day configuration.
- **Duplicate Prevention**: Database-backed tracking prevents sending duplicate notifications.
- **Tracking & Logging**: `email_notifications` table logs all sent/failed emails.

## UI/UX Decisions
- **Design Template**: Admin dashboard template.
- **Theming**: Dark mode support via Tailwind CSS.
- **Forms**: Multi-step license form, direct input fields for clients/vendors, comprehensive forms for vendor and client details.
- **Currency Display**: Prioritizes INR display with real-time conversion for non-INR currencies.

## Technical Implementations
- **Cross-platform Compatibility**: `cross-env` for environment variables.
- **Automated Client/Vendor Creation**: License form automatically creates client and vendor records if new.
- **Data Validation**: Robust validation for fields (e.g., GST Number with 15-character alphanumeric format).

# External Dependencies

## Core Services
- **cPanel MySQL Database**: Primary database storage.
- **PHP's `mysqli` extension**: For MySQL database interaction.

## Development & Build Tools
- **Vite**: Frontend build tool and development server.
- **TypeScript**: For static type checking.
- **ESLint**: Code linting.
- **Tailwind CSS**: Utility-first CSS framework.

## Frontend Libraries
- **React Router DOM**: Client-side routing.
- **Recharts**: Data visualization.
- **Lucide React**: Icon library.
- **date-fns**: Date manipulation.

## Backend Dependencies
- **PHPMailer**: For SMTP email sending.
- **Bcrypt**: Password hashing library.