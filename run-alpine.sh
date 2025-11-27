#!/bin/sh
set -e

# Alpine LXC run script for moxbox
# Usage: ./run-alpine.sh [--dev|--build] [--force]

# === CONFIG ===
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SETUP_MARKER="$SCRIPT_DIR/.alpine-setup-done"
MODE="dev"
FORCE_ENV=false

# === HELPERS ===
info() { echo "[INFO] $1"; }
warn() { echo "[WARN] $1"; }
err() { echo "[ERROR] $1"; exit 1; }

prompt() { printf "%s" "$1"; read -r ans; echo "$ans"; }
prompt_hidden() {
    printf "%s" "$1"
    stty -echo 2>/dev/null || true
    read -r ans
    stty echo 2>/dev/null || true
    echo "" >&2
    echo "$ans"
}

# === ARGS ===
while [ $# -gt 0 ]; do
    case "$1" in
        --dev) MODE="dev"; shift ;;
        --build) MODE="build"; shift ;;
        --force) FORCE_ENV=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--dev|--build] [--force]"
            echo "  --dev     Development mode (default)"
            echo "  --build   Build and run production"
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
    
    info "Installing dependencies..."
    (cd "$SCRIPT_DIR/backend" && pnpm install)
    (cd "$SCRIPT_DIR/frontend" && pnpm install)
    
    touch "$SETUP_MARKER"
    info "Setup complete!"
else
    info "Packages installed (rm $SETUP_MARKER to reinstall)"
fi

# === STEP 2: ENVIRONMENT CONFIG ===
BE_ENV="$SCRIPT_DIR/backend/.env"
FE_ENV="$SCRIPT_DIR/frontend/.env"

setup_env() {
    info "Configuring environment..."
    
    BE_PORT=$(prompt "Backend port [4200]: "); BE_PORT=${BE_PORT:-4200}
    FE_PORT=$(prompt "Frontend port [5173]: "); FE_PORT=${FE_PORT:-5173}
    FILES_DIR=$(prompt "Files directory [./files]: "); FILES_DIR=${FILES_DIR:-./files}
    ADMIN_USER=$(prompt "Admin username [admin]: "); ADMIN_USER=${ADMIN_USER:-admin}
    ADMIN_PASS=$(prompt_hidden "Admin password: ")
    [ -z "$ADMIN_PASS" ] && err "Password required"
    
    # Generate secrets
    info "Generating secrets..."
    JWT=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    HASH=$(cd "$SCRIPT_DIR/backend" && node -e "console.log(require('bcrypt').hashSync(process.argv[1],10))" "$ADMIN_PASS")
    
    # Backend .env
    cat > "$BE_ENV" <<EOF
PORT=$BE_PORT
HOST=0.0.0.0
JWT_SECRET=$JWT
ADMIN_USERNAME=$ADMIN_USER
ADMIN_PASSWORD_HASH=$HASH
FILES_DIR=$FILES_DIR
FRONTEND_URL=http://localhost:$FE_PORT
EOF
    
    # Frontend .env
    cat > "$FE_ENV" <<EOF
VITE_BACKEND_URL=http://localhost:$BE_PORT
EOF
    
    mkdir -p "$SCRIPT_DIR/backend/$FILES_DIR"
    info "Configured: BE=$BE_PORT, FE=$FE_PORT"
}

if [ "$FORCE_ENV" = true ] || [ ! -f "$BE_ENV" ] || [ ! -f "$FE_ENV" ]; then
    setup_env
else
    info "Using existing .env (--force to regenerate)"
    BE_PORT=$(grep "^PORT=" "$BE_ENV" | cut -d= -f2)
    FE_PORT=$(grep "^VITE_BACKEND_URL=" "$FE_ENV" | sed 's/.*:\([0-9]*\)$/\1/')
fi

# === STEP 3: BUILD (production only) ===
if [ "$MODE" = "build" ]; then
    info "Building..."
    (cd "$SCRIPT_DIR/backend" && pnpm run build)
    (cd "$SCRIPT_DIR/frontend" && pnpm run build)
fi

# === STEP 4: START SERVICES ===
cleanup() {
    warn "Shutting down..."
    [ -n "$BE_PID" ] && kill $BE_PID 2>/dev/null || true
    [ -n "$FE_PID" ] && kill $FE_PID 2>/dev/null || true
    wait 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

if [ "$MODE" = "dev" ]; then
    (cd "$SCRIPT_DIR/backend" && pnpm run dev) & BE_PID=$!
    (cd "$SCRIPT_DIR/frontend" && pnpm run dev --host --port "$FE_PORT") & FE_PID=$!
else
    (cd "$SCRIPT_DIR/backend" && node dist/index.js) & BE_PID=$!
    (cd "$SCRIPT_DIR/frontend" && pnpm run preview -- --host 0.0.0.0 --port "$FE_PORT") & FE_PID=$!
fi

sleep 3
kill -0 $BE_PID 2>/dev/null || err "Backend failed"
kill -0 $FE_PID 2>/dev/null || err "Frontend failed"

info "========================================"
info "moxbox running!"
info "Backend:  http://0.0.0.0:$BE_PORT"
info "Frontend: http://0.0.0.0:$FE_PORT"
info "========================================"
info "Ctrl+C to stop"

wait -n
warn "Service stopped"
cleanup
