#!/bin/sh
set -e

# Alpine LXC run script for moxbox project
# Installs dependencies, generates .env, and runs frontend + backend

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo "${RED}[ERROR]${NC} $1"
}

# Default values
MODE="dev"
PORT="4200"
FILES_DIR="./files"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD=""
FRONTEND_PORT="5173"

# Parse arguments
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
        --port)
            PORT="$2"
            shift 2
            ;;
        --files-dir)
            FILES_DIR="$2"
            shift 2
            ;;
        --password)
            ADMIN_PASSWORD="$2"
            shift 2
            ;;
        --frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev               Run in development mode (default)"
            echo "  --build             Build and run in production mode"
            echo "  --port PORT         Backend port (default: 4200)"
            echo "  --files-dir DIR     Files directory (default: ./files)"
            echo "  --password PASS     Admin password (will prompt if not provided)"
            echo "  --frontend-port     Frontend port (default: 5173)"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --dev"
            echo "  $0 --build --port 8080 --password mypass123"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

print_info "Starting moxbox setup in ${MODE} mode..."

# Get script directory (where this script is located)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

print_info "Working directory: $SCRIPT_DIR"

# Check if running as root
if [ "$(id -u)" -ne 0 ]; then
    print_warn "This script should be run as root for package installation"
    print_warn "Attempting to continue, but may fail on apk commands..."
fi

# Step 1: Install Alpine packages
print_info "Installing Alpine system packages..."
apk update || print_warn "apk update failed, continuing..."
apk add --no-cache \
    nodejs \
    npm \
    git \
    curl \
    ca-certificates \
    bash \
    build-base \
    python3 \
    libc6-compat \
    openssl || {
        print_error "Failed to install system packages"
        exit 1
    }

print_info "Node version: $(node --version)"
print_info "npm version: $(npm --version)"

# Step 2: Install global npm tools
print_info "Installing pnpm globally..."
npm install -g pnpm@latest || {
    print_error "Failed to install global npm packages"
    exit 1
}

print_info "pnpm version: $(pnpm --version)"

# Step 3: Install project dependencies
print_info "Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install || {
    print_error "Failed to install backend dependencies"
    exit 1
}

print_info "Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install || {
    print_error "Failed to install frontend dependencies"
    exit 1
}

cd "$SCRIPT_DIR"

# Step 4: Generate secrets and password hash
print_info "Generating JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

if [ -z "$ADMIN_PASSWORD" ]; then
    print_info "Please enter admin password (input hidden):"
    stty -echo 2>/dev/null || true
    read ADMIN_PASSWORD
    stty echo 2>/dev/null || true
    echo ""
    
    if [ -z "$ADMIN_PASSWORD" ]; then
        print_error "Password cannot be empty"
        exit 1
    fi
fi

print_info "Generating password hash..."
cd "$SCRIPT_DIR/backend"
ADMIN_PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); const pw = process.argv[1]; console.log(bcrypt.hashSync(pw, 10));" "$ADMIN_PASSWORD")
cd "$SCRIPT_DIR"

if [ -z "$ADMIN_PASSWORD_HASH" ]; then
    print_error "Failed to generate password hash"
    exit 1
fi

# Step 5: Create backend .env file
print_info "Creating backend/.env file..."
cat > "$SCRIPT_DIR/backend/.env" <<EOF
PORT=$PORT
HOST=0.0.0.0
JWT_SECRET=$JWT_SECRET
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD_HASH=$ADMIN_PASSWORD_HASH
FILES_DIR=$FILES_DIR
EOF

print_info "Created .env with PORT=$PORT, FILES_DIR=$FILES_DIR"

# Step 6: Create files directory
print_info "Creating files directory..."
mkdir -p "$SCRIPT_DIR/backend/$FILES_DIR"
chmod 755 "$SCRIPT_DIR/backend/$FILES_DIR" 2>/dev/null || true

# Step 7: Build if needed
if [ "$MODE" = "build" ]; then
    print_info "Building backend (TypeScript compilation)..."
    cd "$SCRIPT_DIR/backend"
    pnpm run build || {
        print_error "Backend build failed"
        exit 1
    }
    
    print_info "Building frontend (Vite)..."
    cd "$SCRIPT_DIR/frontend"
    pnpm run build || {
        print_error "Frontend build failed"
        exit 1
    }
    
    cd "$SCRIPT_DIR"
fi

# Step 8: Start services
print_info "Starting services..."
print_info "Backend will run on http://0.0.0.0:$PORT"
print_info "Frontend will run on http://0.0.0.0:$FRONTEND_PORT"

# Cleanup function
cleanup() {
    print_warn "Shutting down services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    wait 2>/dev/null || true
    print_info "Cleanup complete"
    exit 0
}

trap cleanup INT TERM

if [ "$MODE" = "dev" ]; then
    print_info "Starting in DEVELOPMENT mode..."
    
    cd "$SCRIPT_DIR/backend"
    pnpm run dev &
    BACKEND_PID=$!
    print_info "Backend (dev) started with PID $BACKEND_PID"
    
    cd "$SCRIPT_DIR/frontend"
    pnpm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT &
    FRONTEND_PID=$!
    print_info "Frontend (dev) started with PID $FRONTEND_PID"
    
else
    print_info "Starting in PRODUCTION mode..."
    
    cd "$SCRIPT_DIR/backend"
    node dist/index.js &
    BACKEND_PID=$!
    print_info "Backend (production) started with PID $BACKEND_PID"
    
    cd "$SCRIPT_DIR/frontend"
    pnpm run preview -- --host 0.0.0.0 --port $FRONTEND_PORT &
    FRONTEND_PID=$!
    print_info "Frontend (preview) started with PID $FRONTEND_PID"
fi

cd "$SCRIPT_DIR"

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 3

# Check if processes are still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend process died unexpectedly"
    cleanup
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend process died unexpectedly"
    cleanup
fi

print_info "${GREEN}========================================${NC}"
print_info "${GREEN}Services are running!${NC}"
print_info "Backend:  http://0.0.0.0:$PORT"
print_info "Frontend: http://0.0.0.0:$FRONTEND_PORT"
print_info "Admin username: $ADMIN_USERNAME"
print_info "${GREEN}========================================${NC}"
print_info "Press Ctrl+C to stop all services"

# Wait for any process to exit
wait -n

print_warn "One of the services has stopped"
cleanup
