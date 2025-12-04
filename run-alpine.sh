#!/bin/sh
set -e

# =============================================================================
# moxbox - Alpine LXC Run Script
# =============================================================================
# Automatically detects all network interfaces, configures CORS for all IPs,
# and manages a centralized .env file at the project root.
#
# Usage: ./run-alpine.sh [--dev|--build] [--force] [--list-ips]
#
# Features:
#   - Auto-detects ALL network IPs (including Tailscale, VPN, etc.)
#   - Generates CORS-allowed origins for every detected IP
#   - Single .env at project root, synced to backend/.env and frontend/.env
#   - No manual IP/port prompts (edit .env to customize)
#   - Re-detects IPs on every run to handle network changes
# =============================================================================

# === CONFIGURATION ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETUP_MARKER="$SCRIPT_DIR/.alpine-setup-done"
ROOT_ENV="$SCRIPT_DIR/.env"
BE_ENV="$SCRIPT_DIR/backend/.env"
FE_ENV="$SCRIPT_DIR/frontend/.env"
MODE="dev"
FORCE_ENV=false
LIST_IPS_ONLY=false

# === HELPER FUNCTIONS ===

# Logging helpers with consistent formatting
info()  { echo "[INFO] $1"; }
warn()  { echo "[WARN] $1"; }
err()   { echo "[ERROR] $1"; exit 1; }
debug() { [ "$DEBUG" = "true" ] && echo "[DEBUG] $1" || true; }

# Prompt for user input (visible)
prompt() {
    printf "%s" "$1" >&2
    read -r ans
    echo "$ans"
}

# Prompt for sensitive input (hidden)
prompt_hidden() {
    printf "%s" "$1" >&2
    stty -echo 2>/dev/null || true
    read -r ans
    stty echo 2>/dev/null || true
    echo "" >&2
    echo "$ans"
}

# =============================================================================
# NETWORK DETECTION
# =============================================================================
# Detects all non-loopback IPv4 addresses from all interfaces.
# Works on Alpine Linux, standard Linux, and most POSIX systems.
# Returns space-separated list of unique IPs.
# Note: Strips carriage returns to avoid corruption issues.
# =============================================================================
detect_all_ips() {
    _da_ips=""
    
    # Method 1: Try 'ip' command (modern Linux, including Alpine)
    if command -v ip >/dev/null 2>&1; then
        _da_ips=$(ip -4 addr show 2>/dev/null | \
              awk '/inet / && !/127\.0\.0\.1/ {gsub(/\/.*/, "", $2); print $2}' | \
              tr -d '\r' | sort -u | tr '\n' ' ')
    fi
    
    # Method 2: Fallback to 'hostname -I' (some systems)
    if [ -z "$_da_ips" ] && command -v hostname >/dev/null 2>&1; then
        _da_ips=$(hostname -I 2>/dev/null | tr -d '\r' | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')
    fi
    
    # Method 3: Fallback to ifconfig (older systems)
    if [ -z "$_da_ips" ] && command -v ifconfig >/dev/null 2>&1; then
        _da_ips=$(ifconfig 2>/dev/null | \
              awk '/inet / && !/127\.0\.0\.1/ {gsub(/addr:/, "", $2); print $2}' | \
              tr -d '\r' | sort -u | tr '\n' ' ')
    fi
    
    # Trim whitespace and remove any stray carriage returns
    echo "$_da_ips" | tr -d '\r' | xargs
}

# =============================================================================
# BUILD FRONTEND_URLS
# =============================================================================
# Creates a comma-separated list of allowed CORS origins from detected IPs.
# Always includes localhost as a fallback for local development.
# Format: http://IP1:PORT,http://IP2:PORT,...
# =============================================================================
build_frontend_urls() {
    _bf_port="$1"
    _bf_ips="$2"
    
    # Ensure the input list is clean: remove CR, duplicate whitespace, and dedupe
    _bf_ips=$(printf "%s" "$_bf_ips" | tr -d '\r' | tr -s ' ')
    # Sort & dedupe the IP list while preserving space-separated format
    _bf_ips=$(printf "%s\n" $_bf_ips | sort -u | tr '\n' ' ')

    # Build the urls, starting with localhost default
    _bf_result="http://localhost:${_bf_port}"
    for _bf_ip in $_bf_ips; do
        [ -z "$_bf_ip" ] && continue
        [ "$_bf_ip" = "127.0.0.1" ] && continue
        _bf_result="${_bf_result},http://${_bf_ip}:${_bf_port}"
    done

    # Final sanitization: drop any stray CRs and collapse multiple commas
    _bf_result=$(printf "%s" "$_bf_result" | tr -d '\r' | sed -E 's/,\s*/,/g; s/^,//; s/,$//')
    printf "%s" "$_bf_result"
}

# =============================================================================
# ENVIRONMENT FILE MANAGEMENT
# =============================================================================
# Reads a value from .env file. Returns empty string if not found.
# Usage: value=$(read_env_value "KEY" "/path/to/.env")
# Note: Avoids 'local' keyword for BusyBox/ash compatibility.
# =============================================================================
read_env_value() {
    _re_key="$1"
    _re_file="$2"
    
    if [ -f "$_re_file" ]; then
        grep "^${_re_key}=" "$_re_file" 2>/dev/null | cut -d= -f2- | head -1
    fi
}

# =============================================================================
# ARGUMENT PARSING
# =============================================================================
while [ $# -gt 0 ]; do
    case "$1" in
        --dev)
            MODE="dev"
            shift
            ;;
        --build)
            MODE="build"
            shift
            ;;
        --force)
            FORCE_ENV=true
            shift
            ;;
        --list-ips)
            LIST_IPS_ONLY=true
            shift
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help|-h)
            cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --dev       Development mode with hot reload (default)
  --build     Build and run production version
  --force     Force regenerate admin password and JWT secret
  --list-ips  Show detected IPs and exit
  --debug     Enable debug output
  --help      Show this help message

Environment:
  Edit .env in the project root to customize ports and settings.
  IPs are auto-detected on every run - no manual configuration needed.

Examples:
  $0                 # Run in dev mode
  $0 --build         # Build and run production
  $0 --force         # Reset admin password
  $0 --list-ips      # Show all detected network IPs
EOF
            exit 0
            ;;
        *)
            err "Unknown option: $1 (use --help for usage)"
            ;;
    esac
done

cd "$SCRIPT_DIR"

# =============================================================================
# STEP 0: LIST IPS MODE (--list-ips)
# =============================================================================
if [ "$LIST_IPS_ONLY" = true ]; then
    info "Detecting network interfaces..."
    ALL_IPS=$(detect_all_ips)
    
    if [ -z "$ALL_IPS" ]; then
        warn "No network IPs detected (only localhost available)"
        echo "localhost"
    else
        info "Detected IPs:"
        for ip in $ALL_IPS; do
            echo "  - $ip"
        done
    fi
    exit 0
fi

info "moxbox setup ($MODE mode)"

# =============================================================================
# STEP 1: SYSTEM PACKAGES (first run only)
# =============================================================================
# Installs Node.js, npm, and pnpm on Alpine Linux.
# Skipped on subsequent runs (marker file tracks completion).
# =============================================================================
if [ ! -f "$SETUP_MARKER" ]; then
    info "First run - installing system packages..."
    
    # Check for root (required for apk)
    [ "$(id -u)" -ne 0 ] && warn "Not running as root - apk may fail"
    
    # Install Node.js and npm
    apk update && apk add --no-cache nodejs npm || err "Failed to install nodejs/npm"
    
    # Install pnpm globally
    npm install -g pnpm@latest || err "Failed to install pnpm"
    
    # Install project dependencies
    info "Installing backend dependencies..."
    (cd "$SCRIPT_DIR/backend" && pnpm install) || err "Backend dependency install failed"
    
    info "Installing frontend dependencies..."
    (cd "$SCRIPT_DIR/frontend" && pnpm install) || err "Frontend dependency install failed"
    
    # Mark setup as complete
    touch "$SETUP_MARKER"
    info "System setup complete!"
else
    debug "Packages already installed (rm $SETUP_MARKER to reinstall)"
fi

# =============================================================================
# STEP 2: DETECT NETWORK IPS
# =============================================================================
# Always re-detect IPs on every run to handle network changes.
# This ensures Tailscale, VPN, and new interfaces are always included.
# =============================================================================
info "Detecting network interfaces..."
ALL_IPS=$(detect_all_ips)
debug "Detected IPs: $ALL_IPS"

# Use first detected IP as primary (for display purposes)
PRIMARY_IP=$(echo "$ALL_IPS" | awk '{print $1}')
[ -z "$PRIMARY_IP" ] && PRIMARY_IP="localhost"

# =============================================================================
# STEP 3: LOAD OR CREATE ROOT .env
# =============================================================================
# The root .env is the single source of truth. On first run, we create it
# from .env.example and prompt for the admin password. On subsequent runs,
# we only update the FRONTEND_URLS with newly detected IPs.
# =============================================================================

# Default values (used if not in .env)
DEFAULT_BE_PORT=4200
DEFAULT_FE_PORT=5173
DEFAULT_FILES_DIR="./files"
DEFAULT_DB_PATH="./db.sqlite"
DEFAULT_MAX_SIZE="1gb"
DEFAULT_BLOCKED_MIME="text/html,application/javascript,text/javascript,application/x-msdownload,application/x-msdos-program,application/x-sh,application/x-bash,application/x-php"

# Check if this is first-time setup (no .env or --force)
NEED_SECRETS=false
if [ ! -f "$ROOT_ENV" ]; then
    info "Creating new .env configuration..."
    NEED_SECRETS=true
    
    # Copy from example if available
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$ROOT_ENV"
    else
        touch "$ROOT_ENV"
    fi
elif [ "$FORCE_ENV" = true ]; then
    info "Regenerating secrets (--force)..."
    NEED_SECRETS=true
fi

# Read current values from .env (or use defaults)
BE_PORT=$(read_env_value "BACKEND_PORT" "$ROOT_ENV")
BE_PORT=${BE_PORT:-$DEFAULT_BE_PORT}

FE_PORT=$(read_env_value "FRONTEND_PORT" "$ROOT_ENV")
FE_PORT=${FE_PORT:-$DEFAULT_FE_PORT}

FILES_DIR=$(read_env_value "FILES_DIR" "$ROOT_ENV")
FILES_DIR=${FILES_DIR:-$DEFAULT_FILES_DIR}
# Normalize FILES_DIR: remove leading ./ if present and collapse slashes
FILES_DIR=$(printf "%s" "$FILES_DIR" | sed 's@^\./@@; s@/*$@@')

# Read ALLOW_ALL_ORIGINS from env; default true in dev mode for convenience
ALLOW_ALL_ORIGINS=$(read_env_value "ALLOW_ALL_ORIGINS" "$ROOT_ENV")
if [ -z "$ALLOW_ALL_ORIGINS" ]; then
    if [ "$MODE" = "dev" ]; then
        ALLOW_ALL_ORIGINS=true
    else
        ALLOW_ALL_ORIGINS=false
    fi
fi

DB_PATH=$(read_env_value "DATABASE_PATH" "$ROOT_ENV")
DB_PATH=${DB_PATH:-$DEFAULT_DB_PATH}

MAX_SIZE=$(read_env_value "UPLOAD_MAX_FILE_SIZE" "$ROOT_ENV")
MAX_SIZE=${MAX_SIZE:-$DEFAULT_MAX_SIZE}

BLOCKED_MIME=$(read_env_value "UPLOAD_DISALLOWED_MIME_TYPES" "$ROOT_ENV")
BLOCKED_MIME=${BLOCKED_MIME:-$DEFAULT_BLOCKED_MIME}

ADMIN_USER=$(read_env_value "ADMIN_USERNAME" "$ROOT_ENV")
ADMIN_USER=${ADMIN_USER:-admin}

JWT_SECRET=$(read_env_value "JWT_SECRET" "$ROOT_ENV")
ADMIN_HASH=$(read_env_value "ADMIN_PASSWORD_HASH" "$ROOT_ENV")

# =============================================================================
# STEP 4: GENERATE SECRETS (first run or --force)
# =============================================================================
# Only prompts for password on first run or when --force is used.
# JWT secret is auto-generated, never prompted.
# =============================================================================
if [ "$NEED_SECRETS" = true ] || [ -z "$JWT_SECRET" ] || [ -z "$ADMIN_HASH" ]; then
    info "Setting up admin credentials..."
    
    # Generate JWT secret automatically
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Prompt for admin password with confirmation
    while true; do
        ADMIN_PASS=$(prompt_hidden "Enter admin password: ")
        [ -z "$ADMIN_PASS" ] && { warn "Password cannot be empty"; continue; }
        
        ADMIN_PASS_CONFIRM=$(prompt_hidden "Confirm admin password: ")
        
        if [ "$ADMIN_PASS" = "$ADMIN_PASS_CONFIRM" ]; then
            break
        else
            warn "Passwords do not match. Please try again."
        fi
    done
    
    # Hash the password using bcrypt
    info "Hashing password..."
    ADMIN_HASH=$(cd "$SCRIPT_DIR/backend" && node -e "console.log(require('bcrypt').hashSync(process.argv[1], 10))" "$ADMIN_PASS")
    
    info "Credentials configured successfully!"
fi

# =============================================================================
# STEP 5: BUILD FRONTEND_URLS FOR CORS
# =============================================================================
# Creates comma-separated list of all allowed origins based on detected IPs.
# This is regenerated on EVERY run to capture network changes.
# =============================================================================
FRONTEND_URLS=$(build_frontend_urls "$FE_PORT" "$ALL_IPS")
info "CORS origins: $FRONTEND_URLS"
# Debug: print raw hex for debugging non-printable chars
if command -v od >/dev/null 2>&1; then
    debug "CORS origins (hex): $(printf "%s" "$FRONTEND_URLS" | od -An -t x1 | sed 's/^ \+//')"
    debug "ALL_IPS (hex): $(printf "%s" "$ALL_IPS" | od -An -t x1 | sed 's/^ \+//')"
fi

# =============================================================================
# STEP 6: WRITE ROOT .env
# =============================================================================
# Writes the complete .env file with all current settings.
# FRONTEND_URLS is always updated with latest detected IPs.
# =============================================================================
info "Writing root .env..."
cat > "$ROOT_ENV" <<EOF
# =============================================================================
# moxbox - Environment Configuration
# =============================================================================
# Auto-generated by run-alpine.sh
# Last updated: $(date '+%Y-%m-%d %H:%M:%S')
#
# FRONTEND_URLS is auto-detected from network interfaces on each run.
# Edit other values as needed, then restart the script.
# =============================================================================

# --- Server Ports ---
BACKEND_PORT=$BE_PORT
FRONTEND_PORT=$FE_PORT

# --- CORS Allowed Origins (auto-detected) ---
# All detected network IPs are included so requests work from any interface.
# Add custom domains by appending: ,https://yourdomain.com
FRONTEND_URLS=$FRONTEND_URLS

# Development helpers (true/false)
ALLOW_ALL_ORIGINS=$ALLOW_ALL_ORIGINS

# --- Authentication ---
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD_HASH=$ADMIN_HASH
JWT_SECRET=$JWT_SECRET

# --- Storage ---
# Use ./ prefix for relative path to backend cwd
FILES_DIR=./$FILES_DIR
DATABASE_PATH=$DB_PATH

# --- Upload Limits ---
UPLOAD_MAX_FILE_SIZE=$MAX_SIZE
UPLOAD_DISALLOWED_MIME_TYPES=$BLOCKED_MIME
EOF

# =============================================================================
# STEP 7: SYNC TO BACKEND/.env
# =============================================================================
# Backend expects specific variable names. We translate from root .env format.
# HOST is always 0.0.0.0 to bind on all interfaces.
# =============================================================================
info "Syncing backend/.env..."
cat > "$BE_ENV" <<EOF
# =============================================================================
# Backend Environment (auto-generated from root .env)
# Do not edit directly - modify ../.env instead
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# =============================================================================

# Server binding
PORT=$BE_PORT
HOST=0.0.0.0

# CORS - comma-separated list of allowed frontend origins
FRONTEND_URLS=$FRONTEND_URLS
ALLOW_ALL_ORIGINS=$ALLOW_ALL_ORIGINS

# Authentication
JWT_SECRET=$JWT_SECRET
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD_HASH=$ADMIN_HASH

# Storage
# Use relative path for backend to keep path as ./files
FILES_DIR=./$FILES_DIR
DATABASE_PATH=$DB_PATH

# Upload limits
UPLOAD_MAX_FILE_SIZE=$MAX_SIZE
UPLOAD_DISALLOWED_MIME_TYPES=$BLOCKED_MIME
EOF

# Ensure files directory exists both in backend root and project root
# Expand file dir to absolute paths. If FILES_DIR begins with ./, remove that for backend path
_files_dir_sanitized=$(printf "%s" "$FILES_DIR" | sed 's@^\./@@')
_backend_files_dir="$SCRIPT_DIR/backend/$_files_dir_sanitized"
_root_files_dir="$SCRIPT_DIR/$_files_dir_sanitized"
info "Ensuring files directories exist: backend: $_backend_files_dir , root: $_root_files_dir"
mkdir -p "$_backend_files_dir" || err "Failed to create backend files dir: $_backend_files_dir"
mkdir -p "$_root_files_dir" || warn "Failed to create root files dir: $_root_files_dir (non-fatal)"

# =============================================================================
# STEP 8: SYNC TO FRONTEND/.env
# =============================================================================
# Frontend uses Vite environment variables (VITE_ prefix).
# VITE_BACKEND_URL uses primary IP for initial requests.
# =============================================================================
info "Syncing frontend/.env..."
cat > "$FE_ENV" <<EOF
# =============================================================================
# Frontend Environment (auto-generated from root .env)
# Do not edit directly - modify ../.env instead
# Generated: $(date '+%Y-%m-%d %H:%M:%S')
# =============================================================================

# Backend API URL (primary IP used, but frontend falls back to window.origin)
VITE_BACKEND_URL=http://$PRIMARY_IP:$BE_PORT
EOF

# Ensure all env files are written to disk before starting services
sync 2>/dev/null || true

# =============================================================================
# STEP 9: BUILD (production mode only)
# =============================================================================
if [ "$MODE" = "build" ]; then
    info "Building for production..."
    
    info "Building backend..."
    (cd "$SCRIPT_DIR/backend" && pnpm run build) || err "Backend build failed"
    
    info "Building frontend..."
    (cd "$SCRIPT_DIR/frontend" && pnpm run build) || err "Frontend build failed"
    
    info "Build complete!"
fi

# =============================================================================
# STEP 10: START SERVICES
# =============================================================================
# Starts backend and frontend as background processes.
# Handles graceful shutdown on SIGINT/SIGTERM.
# =============================================================================

# Cleanup function for graceful shutdown
cleanup() {
    echo ""
    warn "Shutting down services..."
    
    [ -n "$BE_PID" ] && kill "$BE_PID" 2>/dev/null || true
    [ -n "$FE_PID" ] && kill "$FE_PID" 2>/dev/null || true
    
    # Wait for processes to terminate
    wait 2>/dev/null || true
    
    info "Goodbye!"
    exit 0
}

# Register signal handlers
trap cleanup INT TERM

# Start services based on mode
if [ "$MODE" = "dev" ]; then
    info "Starting development servers..."
    
    # Backend with hot reload
    (cd "$SCRIPT_DIR/backend" && pnpm run dev) &
    BE_PID=$!
    
    # Frontend with hot reload, bound to all interfaces
    # Using pnpm exec vite directly for cleaner argument passing
    (cd "$SCRIPT_DIR/frontend" && pnpm exec vite --host 0.0.0.0 --port "$FE_PORT") &
    FE_PID=$!
else
    info "Starting production servers..."
    
    # Backend from compiled JS
    (cd "$SCRIPT_DIR/backend" && node dist/index.js) &
    BE_PID=$!
    
    # Frontend preview server
    (cd "$SCRIPT_DIR/frontend" && pnpm exec vite preview --host 0.0.0.0 --port "$FE_PORT") &
    FE_PID=$!
fi

# Wait for services to initialize
sleep 3

# Verify services are running
kill -0 "$BE_PID" 2>/dev/null || err "Backend failed to start (check logs above)"
kill -0 "$FE_PID" 2>/dev/null || err "Frontend failed to start (check logs above)"

# =============================================================================
# STEP 11: DISPLAY ACCESS INFO
# =============================================================================
# Shows all available URLs for accessing the application.
# =============================================================================
echo ""
info "========================================"
info "  moxbox is running!"
info "========================================"
info ""
info "Backend API:"
info "  http://localhost:$BE_PORT"
for ip in $ALL_IPS; do
    [ "$ip" != "127.0.0.1" ] && info "  http://$ip:$BE_PORT"
done
info ""
info "Frontend UI:"
info "  http://localhost:$FE_PORT"
for ip in $ALL_IPS; do
    [ "$ip" != "127.0.0.1" ] && info "  http://$ip:$FE_PORT"
done
info ""
info "CORS is configured for ALL above addresses."
info "========================================"
info "Press Ctrl+C to stop"
echo ""

# =============================================================================
# STEP 12: WAIT FOR EXIT
# =============================================================================
# Keeps script running until a service exits or signal received.
# =============================================================================
while kill -0 "$BE_PID" 2>/dev/null && kill -0 "$FE_PID" 2>/dev/null; do
    sleep 1
done

# If we get here, a service exited unexpectedly
warn "A service has stopped unexpectedly"
cleanup
