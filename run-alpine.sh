#!/bin/sh
set -e

# Alpine LXC run script for moxbox
# Usage: ./run-alpine.sh [--force]

# === CONFIG ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETUP_MARKER="$SCRIPT_DIR/.alpine-setup-done"
MODE="build"
FORCE_ENV=false

# === HELPERS ===
info() { echo "[INFO] $1"; }
warn() { echo "[WARN] $1"; }
err() { echo "[ERROR] $1"; exit 1; }

prompt() { printf "%s" "$1" >&2; read -r ans; echo "$ans"; }
prompt_hidden() {
    printf "%s" "$1" >&2
    stty -echo 2>/dev/null || true
    read -r ans
    stty echo 2>/dev/null || true
    echo "" >&2
    echo "$ans"
}

# === ARGS ===
while [ $# -gt 0 ]; do
    case "$1" in
        --force) FORCE_ENV=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--force]"
            echo "  --force   Regenerate .env files"
            exit 0 ;;
        *) err "Unknown: $1" ;;
    esac
done

cd "$SCRIPT_DIR"
info "moxbox setup ($MODE mode)"

# === STEP 1: SYSTEM PACKAGES (first run only) ===
if [ ! -f "$SETUP_MARKER" ]; then
    info "First run - installing packages..."
    [ "$(id -u)" -ne 0 ] && warn "Run as root for apk"
    
    apk update && apk add --no-cache nodejs npm || err "Package install failed"
    npm install -g pnpm@latest || err "pnpm install failed"
    
    info "Installing minimal global tools..."
    # Install bcryptjs globally to avoid installing full project dependencies just for hashing a password
    npm install -g bcryptjs >/dev/null 2>&1 || warn "Could not install bcryptjs globally; fallback will be used later"
    
    touch "$SETUP_MARKER"
    info "Setup complete!"
else
    info "Packages installed (rm $SETUP_MARKER to reinstall)"
fi

# === STEP 2: ENVIRONMENT CONFIG ===
ROOT_ENV="$SCRIPT_DIR/.env"

setup_env() {
    info "Configuring environment..."
    
    # Auto-detect all non-localhost IPv4 addresses
    # Combine IPs from both hostname -I and `ip addr` to include all interfaces like tailscale
    DETECTED_IPS="$(hostname -I 2>/dev/null || true) $(ip -4 addr show 2>/dev/null | awk '/inet / && !/127.0.0.1/ {gsub(/\/.*/, "", $2); print $2}' | tr '\n' ' ')"
    # Normalize list: split, unique, remove empties
    DETECTED_IPS=$(echo "$DETECTED_IPS" | tr ' ' '\n' | awk '!seen[$0]++ && length($0)>0 {print $0}' | tr '\n' ' ')
    # Default to first detected IP or localhost
    DETECTED_IP=$(echo "$DETECTED_IPS" | awk '{print $1}')
    [ -z "$DETECTED_IP" ] && DETECTED_IP="localhost"

    HOST_IP=$(prompt "Host IP/domain [$DETECTED_IP]: "); HOST_IP=${HOST_IP:-$DETECTED_IP}
    BE_PORT=$(prompt "Backend port [4200]: "); BE_PORT=${BE_PORT:-4200}
    FE_PORT=$(prompt "Frontend port [5173]: "); FE_PORT=${FE_PORT:-5173}
    UPLOAD_MAX_FILE_SIZE=$(prompt "Upload max file size [100mb]: "); UPLOAD_MAX_FILE_SIZE=${UPLOAD_MAX_FILE_SIZE:-100mb}
    FILES_DIR=$(prompt "Files directory [./files]: "); FILES_DIR=${FILES_DIR:-./files}
    ADMIN_USER=$(prompt "Admin username [admin]: "); ADMIN_USER=${ADMIN_USER:-admin}
    
    # Password with confirmation
    while true; do
        ADMIN_PASS=$(prompt_hidden "Admin password: ")
        [ -z "$ADMIN_PASS" ] && err "Password required"
        ADMIN_PASS_CONFIRM=$(prompt_hidden "Confirm password: ")
        if [ "$ADMIN_PASS" = "$ADMIN_PASS_CONFIRM" ]; then
            break
        else
            warn "Passwords do not match. Try again."
        fi
    done
    
    # Generate secrets
    info "Generating secrets..."
    JWT=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    # Use bcryptjs if available globally (faster without installing project deps). Otherwise install temporarily.
    if node -e "try{require('bcryptjs'); console.log(true);}catch(e){console.log(false);}" | grep true >/dev/null 2>&1; then
        HASH=$(node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" "$ADMIN_PASS")
    else
        TMPDIR=$(mktemp -d)
        (cd "$TMPDIR" && npm init -y >/dev/null 2>&1 && npm install bcryptjs >/dev/null 2>&1)
        HASH=$(cd "$TMPDIR" && node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" "$ADMIN_PASS")
        rm -rf "$TMPDIR"
    fi
    
    # Build FRONTEND_ALLOWED_ORIGINS including all detected IP addresses + localhost
    ALLOWED_ORIGINS_LIST=""
    for ip in $DETECTED_IPS; do
        if [ -n "$ip" ]; then
            ALLOWED_ORIGINS_LIST="$ALLOWED_ORIGINS_LIST,http://$ip:$FE_PORT"
        fi
    done
    ALLOWED_ORIGINS_LIST="$ALLOWED_ORIGINS_LIST,http://localhost:$FE_PORT"
    # Always include user-selected HOST_IP too
    ALLOWED_ORIGINS_LIST="$ALLOWED_ORIGINS_LIST,http://$HOST_IP:$FE_PORT"
    # Trim leading comma and deduplicate
    ALLOWED_ORIGINS_LIST=$(echo "$ALLOWED_ORIGINS_LIST" | sed 's/^,//' | tr ',' '\n' | awk '!seen[$0]++ && length($0)>0 {print $0}' | tr '\n' ',')
    ALLOWED_ORIGINS_LIST=$(echo "$ALLOWED_ORIGINS_LIST" | sed 's/,$//')

    # Root .env (includes both backend & frontend variables)
    cat > "$ROOT_ENV" <<EOF
# Backend
PORT=$BE_PORT
HOST=0.0.0.0
JWT_SECRET=$JWT
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD_HASH=$HASH
FILES_DIR=$FILES_DIR
DATABASE_PATH=./db.sqlite
FRONTEND_URL=http://$HOST_IP:$FE_PORT
# Frontend / Vite variables
VITE_BACKEND_URL=http://$HOST_IP:$BE_PORT
VITE_PORT=$FE_PORT
VITE_HOST=0.0.0.0
# CORS allowlist (comma-separated)
FRONTEND_ALLOWED_ORIGINS=$ALLOWED_ORIGINS_LIST
UPLOAD_MAX_FILE_SIZE=$UPLOAD_MAX_FILE_SIZE
EOF
    
    mkdir -p "$SCRIPT_DIR/backend/$FILES_DIR"
    info "Configured: Host=$HOST_IP, BE=$BE_PORT, FE=$FE_PORT"
}

if [ "$FORCE_ENV" = true ] || [ ! -f "$ROOT_ENV" ]; then
    setup_env
else
    info "Using existing .env (--force to regenerate)"
    BE_PORT=$(grep "^PORT=" "$ROOT_ENV" | cut -d= -f2)
    BE_PORT=${BE_PORT:-4200}
    FE_PORT=$(grep "^VITE_PORT=" "$ROOT_ENV" | cut -d= -f2)
    FE_PORT=${FE_PORT:-5173}
fi

# === STEP 3: BUILD (production only) ===
# Always build, then run production
info "Installing project dependencies and building backend & frontend..."
(cd "$SCRIPT_DIR/backend" && pnpm install && pnpm run build)
(cd "$SCRIPT_DIR/frontend" && pnpm install && pnpm run build)

# === STEP 4: START SERVICES ===
cleanup() {
    warn "Shutting down..."
    [ -n "$BE_PID" ] && kill $BE_PID 2>/dev/null || true
    [ -n "$FE_PID" ] && kill $FE_PID 2>/dev/null || true
    wait 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

# Run production artifacts (always)
(cd "$SCRIPT_DIR/backend" && node dist/index.js) & BE_PID=$!
(cd "$SCRIPT_DIR/frontend" && pnpm run preview -- --host 0.0.0.0 --port "$FE_PORT") & FE_PID=$!

sleep 3
kill -0 $BE_PID 2>/dev/null || err "Backend failed"
kill -0 $FE_PID 2>/dev/null || err "Frontend failed"

info "========================================"
info "moxbox running!"
info "Backend:  http://$HOST_IP:$BE_PORT"
info "Frontend: http://$HOST_IP:$FE_PORT"
info "========================================"
info "Ctrl+C to stop"

# Wait for either process to exit (POSIX compatible)
while kill -0 $BE_PID 2>/dev/null && kill -0 $FE_PID 2>/dev/null; do
    sleep 1
done

warn "Service stopped"
cleanup
