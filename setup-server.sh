#!/usr/bin/env bash
# =============================================================================
# Kids Athletics Club - Server Setup Script
# =============================================================================
# This script automates the initial setup of the application on a web server
# after cloning the repository.
#
# Usage:
#   chmod +x setup-server.sh
#   ./setup-server.sh
#
# What it does:
#   1. Detects subdomain and configures environment
#   2. Installs Node.js dependencies
#   3. Creates and configures .env.production
#   4. Tests database connectivity
#   5. Initializes database schema
#   6. Sets up file permissions
#   7. Creates necessary directories
#   8. Configures web server (Passenger/Apache/Nginx)
#   9. Runs initial health checks
#
# Requirements:
#   - Node.js 18+
#   - PostgreSQL 14+
#   - Git
#   - Apache/Nginx with Passenger (or PM2)
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="kids-athletics-club"
MIN_NODE_VERSION=18
LOG_FILE="$SCRIPT_DIR/setup-$(date +%Y%m%d_%H%M%S).log"

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${CYAN}${BOLD}==============================================================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}${BOLD}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${CYAN}${BOLD}==============================================================================${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}${BOLD}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}${BOLD}✓${NC} $1" | tee -a "$LOG_FILE"
}

prompt() {
    echo -e "${BLUE}${BOLD}?${NC} $1"
    read -r response
    echo "$response"
}

prompt_password() {
    echo -e "${BLUE}${BOLD}?${NC} $1"
    read -s -r response
    echo ""
    echo "$response"
}

confirm() {
    echo -e "${BLUE}${BOLD}?${NC} $1 (y/n): "
    read -r response
    [[ "$response" =~ ^[Yy]$ ]]
}

# =============================================================================
# Prerequisite Checks
# =============================================================================

check_prerequisites() {
    log_section "Checking Prerequisites"
    
    # Check if running on Linux/Unix
    if [[ "$OSTYPE" != "linux-gnu"* ]] && [[ "$OSTYPE" != "darwin"* ]]; then
        warn "This script is designed for Linux/Unix systems. You're running: $OSTYPE"
        if ! confirm "Continue anyway?"; then
            exit 0
        fi
    fi
    
    # Check Node.js
    log "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js ${MIN_NODE_VERSION}+ first."
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$MIN_NODE_VERSION" ]; then
        error "Node.js version $MIN_NODE_VERSION+ required. Found: $(node --version)"
    fi
    success "Node.js $(node --version) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed."
    fi
    success "npm $(npm --version) detected"
    
    # Check PostgreSQL client
    log "Checking PostgreSQL client..."
    if ! command -v psql &> /dev/null; then
        warn "psql not found. You'll need PostgreSQL client for database operations."
    else
        success "PostgreSQL client $(psql --version | cut -d' ' -f3) detected"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed."
    fi
    success "Git $(git --version | cut -d' ' -f3) detected"
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        warn "curl not found. Health checks will be limited."
    else
        success "curl detected"
    fi
}

# =============================================================================
# Environment Detection
# =============================================================================

detect_environment() {
    log_section "Detecting Environment"
    
    # Detect current directory and subdomain
    CURRENT_DIR=$(pwd)
    log "Current directory: $CURRENT_DIR"
    
    # Try to detect subdomain from directory path
    if [[ "$CURRENT_DIR" == *"public_html"* ]]; then
        DETECTED_SUBDOMAIN=$(echo "$CURRENT_DIR" | grep -oP '(?<=public_html/)[^/]+' | head -1 || echo "")
        if [ -n "$DETECTED_SUBDOMAIN" ]; then
            log "Detected subdomain from path: $DETECTED_SUBDOMAIN"
        fi
    fi
    
    # Prompt for subdomain/domain
    echo ""
    if [ -n "${DETECTED_SUBDOMAIN:-}" ]; then
        DOMAIN=$(prompt "Enter your domain/subdomain [detected: $DETECTED_SUBDOMAIN.hardweb.ro]: ")
        if [ -z "$DOMAIN" ]; then
            DOMAIN="${DETECTED_SUBDOMAIN}.hardweb.ro"
        fi
    else
        DOMAIN=$(prompt "Enter your full domain/subdomain (e.g., dev.clubatletism.ro): ")
    fi
    
    if [ -z "$DOMAIN" ]; then
        error "Domain is required!"
    fi
    
    log "Domain set to: $DOMAIN"
    
    # Determine protocol
    if [[ "$DOMAIN" == "localhost"* ]] || [[ "$DOMAIN" == "127.0.0.1"* ]]; then
        PROTOCOL="http"
    else
        PROTOCOL="https"
    fi
    
    BASE_URL="${PROTOCOL}://${DOMAIN}"
    log "Base URL: $BASE_URL"
    
    export DOMAIN
    export BASE_URL
    export PROTOCOL
}

# =============================================================================
# Database Configuration
# =============================================================================

configure_database() {
    log_section "Configuring Database"
    
    echo ""
    log "Enter PostgreSQL database credentials:"
    echo ""
    
    DB_HOST=$(prompt "Database host [localhost]: ")
    DB_HOST=${DB_HOST:-localhost}
    
    DB_PORT=$(prompt "Database port [5432]: ")
    DB_PORT=${DB_PORT:-5432}
    
    DB_NAME=$(prompt "Database name: ")
    if [ -z "$DB_NAME" ]; then
        error "Database name is required!"
    fi
    
    DB_USER=$(prompt "Database user: ")
    if [ -z "$DB_USER" ]; then
        error "Database user is required!"
    fi
    
    DB_PASSWORD=$(prompt_password "Database password: ")
    if [ -z "$DB_PASSWORD" ]; then
        error "Database password is required!"
    fi
    
    # Test database connection
    log "Testing database connection..."
    
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        success "Database connection successful!"
    else
        error "Failed to connect to database. Please check your credentials."
    fi
    unset PGPASSWORD
    
    export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
}

# =============================================================================
# JWT Secret Generation
# =============================================================================

generate_jwt_secret() {
    log_section "Generating JWT Secret"
    
    # Generate a secure random JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n' 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
    
    log "Generated secure JWT secret"
    export JWT_SECRET
}

# =============================================================================
# Environment File Creation
# =============================================================================

create_env_file() {
    log_section "Creating Environment Configuration"
    
    ENV_FILE="$SCRIPT_DIR/server/.env.production"
    
    if [ -f "$ENV_FILE" ]; then
        warn "File $ENV_FILE already exists"
        if confirm "Overwrite existing .env.production?"; then
            log "Backing up existing .env.production..."
            cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
            success "Backup created"
        else
            log "Keeping existing .env.production"
            return 0
        fi
    fi
    
    PORT=$(prompt "Application port [5000]: ")
    PORT=${PORT:-5000}
    
    log "Creating $ENV_FILE..."
    
    cat > "$ENV_FILE" << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Server Configuration
PORT=$PORT
NODE_ENV=production

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Application URL
BASE_URL=$BASE_URL

# CORS Configuration
CORS_ORIGIN=$BASE_URL

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# Session Configuration
SESSION_TIMEOUT=1800000
REMEMBER_ME_DURATION=604800000

# Logging
LOG_LEVEL=info
EOF
    
    chmod 600 "$ENV_FILE"
    success "Environment file created at $ENV_FILE"
    log "File permissions set to 600 (owner read/write only)"
}

# =============================================================================
# Dependencies Installation
# =============================================================================

install_dependencies() {
    log_section "Installing Dependencies"
    
    # Install root dependencies
    log "Installing root dependencies..."
    if npm install --legacy-peer-deps; then
        success "Root dependencies installed"
    else
        error "Failed to install root dependencies"
    fi
    
    # Install server dependencies
    log "Installing server dependencies..."
    cd "$SCRIPT_DIR/server"
    if npm install --legacy-peer-deps; then
        success "Server dependencies installed"
    else
        error "Failed to install server dependencies"
    fi
    cd "$SCRIPT_DIR"
}

# =============================================================================
# Database Initialization
# =============================================================================

initialize_database() {
    log_section "Initializing Database"
    
    if ! confirm "Initialize database schema? (This will create tables)"; then
        warn "Skipping database initialization"
        return 0
    fi
    
    export PGPASSWORD="$DB_PASSWORD"
    
    # Check if schema.sql exists
    if [ ! -f "$SCRIPT_DIR/server/schema.sql" ]; then
        error "schema.sql not found in server/ directory"
    fi
    
    log "Running schema.sql..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/server/schema.sql" >> "$LOG_FILE" 2>&1; then
        success "Database schema initialized"
    else
        warn "Schema initialization encountered issues. Check $LOG_FILE for details."
        if ! confirm "Continue anyway?"; then
            exit 1
        fi
    fi
    
    # Run init-data.sql if exists
    if [ -f "$SCRIPT_DIR/server/init-data.sql" ]; then
        log "Running init-data.sql..."
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/server/init-data.sql" >> "$LOG_FILE" 2>&1; then
            success "Initial data loaded"
        else
            warn "Data initialization encountered issues. Check $LOG_FILE for details."
        fi
    fi
    
    # Run migrations
    if [ -d "$SCRIPT_DIR/server/migrations" ]; then
        log "Checking for database migrations..."
        MIGRATION_COUNT=$(find "$SCRIPT_DIR/server/migrations" -name "*.sql" -type f 2>/dev/null | wc -l)
        if [ "$MIGRATION_COUNT" -gt 0 ]; then
            log "Found $MIGRATION_COUNT migration file(s)"
            if confirm "Run migrations?"; then
                for migration in "$SCRIPT_DIR/server/migrations"/*.sql; do
                    if [ -f "$migration" ]; then
                        log "Applying migration: $(basename "$migration")"
                        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration" >> "$LOG_FILE" 2>&1; then
                            success "Migration applied: $(basename "$migration")"
                        else
                            warn "Migration failed: $(basename "$migration"). Check $LOG_FILE"
                        fi
                    fi
                done
            fi
        fi
    fi
    
    unset PGPASSWORD
}

# =============================================================================
# Directory Structure Setup
# =============================================================================

setup_directories() {
    log_section "Setting Up Directory Structure"
    
    # Create necessary directories
    DIRS=(
        "tmp"
        "logs"
        "uploads"
        "uploads/athletes"
        ".deployment-backups"
        "server/logs"
    )
    
    for dir in "${DIRS[@]}"; do
        if [ ! -d "$SCRIPT_DIR/$dir" ]; then
            log "Creating directory: $dir"
            mkdir -p "$SCRIPT_DIR/$dir"
            success "Created $dir"
        else
            log "Directory already exists: $dir"
        fi
    done
    
    # Set proper permissions
    log "Setting directory permissions..."
    chmod 755 "$SCRIPT_DIR/uploads"
    chmod 755 "$SCRIPT_DIR/uploads/athletes"
    chmod 755 "$SCRIPT_DIR/tmp"
    chmod 755 "$SCRIPT_DIR/logs"
    success "Permissions set"
}

# =============================================================================
# Build Verification
# =============================================================================

verify_builds() {
    log_section "Verifying Build Artifacts"
    
    # Check frontend build
    if [ -d "$SCRIPT_DIR/dist" ] && [ -f "$SCRIPT_DIR/index.html" ]; then
        success "Frontend build artifacts found"
        BUNDLE_COUNT=$(find "$SCRIPT_DIR/dist" -name "index-*.js" | wc -l)
        log "Found $BUNDLE_COUNT JavaScript bundle(s)"
    else
        warn "Frontend build artifacts not found"
        log "You may need to run 'npm run build' locally and push to repository"
    fi
    
    # Check backend build
    if [ -d "$SCRIPT_DIR/server/dist" ] && [ -f "$SCRIPT_DIR/server/dist/index.js" ]; then
        success "Backend build artifacts found"
    else
        warn "Backend build artifacts not found"
        log "You may need to run 'cd server && npm run build' locally and push to repository"
    fi
}

# =============================================================================
# Web Server Configuration
# =============================================================================

configure_webserver() {
    log_section "Configuring Web Server"
    
    # Detect web server
    if command -v passenger-config &> /dev/null; then
        log "Detected Passenger"
        
        # Check if .htaccess exists for Apache
        if [ ! -f "$SCRIPT_DIR/.htaccess" ]; then
            log "Creating .htaccess for Apache/Passenger..."
            cat > "$SCRIPT_DIR/.htaccess" << 'EOF'
PassengerEnabled on
PassengerAppType node
PassengerStartupFile app.cjs
PassengerAppRoot /path/to/kids-athletics-club

# Enable rewrite engine
RewriteEngine On

# Serve static files from dist directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !\.(js|css|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot|ico)$
RewriteRule ^(.*)$ app.cjs [QSA,L]

# Cache static assets
<FilesMatch "\.(js|css|jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot|ico)$">
    Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
EOF
            
            # Update path in .htaccess
            sed -i "s|/path/to/kids-athletics-club|$SCRIPT_DIR|g" "$SCRIPT_DIR/.htaccess"
            success "Created .htaccess"
        else
            log ".htaccess already exists"
        fi
        
        # Create restart.txt for easy restarts
        touch "$SCRIPT_DIR/tmp/restart.txt"
        success "Passenger configured. Use 'touch tmp/restart.txt' to restart"
        
    elif command -v pm2 &> /dev/null; then
        log "Detected PM2"
        
        if confirm "Start application with PM2?"; then
            cd "$SCRIPT_DIR"
            pm2 start app.cjs --name "$APP_NAME" --time
            pm2 save
            success "Application started with PM2"
            log "Use 'pm2 restart $APP_NAME' to restart"
        fi
        
    else
        warn "No supported web server detected (Passenger or PM2)"
        log "You may need to configure your web server manually"
    fi
}

# =============================================================================
# Initialize Permissions System
# =============================================================================

initialize_permissions() {
    log_section "Initializing Permissions System"
    
    if ! confirm "Initialize permissions and roles via API?"; then
        warn "Skipping permissions initialization"
        log "You can run this later: curl $BASE_URL/api/setup/initialize-data?reset_permissions=true"
        return 0
    fi
    
    log "Waiting 5 seconds for application to start..."
    sleep 5
    
    log "Calling initialization endpoint..."
    if command -v curl &> /dev/null; then
        RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/setup/initialize-data?reset_permissions=true" || echo "HTTP_CODE:000")
        HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
        
        if [ "$HTTP_CODE" = "200" ]; then
            success "Permissions initialized successfully"
            echo "$RESPONSE" | grep -v "HTTP_CODE:" | head -20
        else
            warn "Permissions initialization returned HTTP $HTTP_CODE"
            log "You can try manually: curl $BASE_URL/api/setup/initialize-data?reset_permissions=true"
        fi
    else
        log "curl not available. Initialize manually:"
        log "  curl $BASE_URL/api/setup/initialize-data?reset_permissions=true"
    fi
}

# =============================================================================
# Health Checks
# =============================================================================

run_health_checks() {
    log_section "Running Health Checks"
    
    if ! command -v curl &> /dev/null; then
        warn "curl not available. Skipping health checks."
        return 0
    fi
    
    log "Waiting 5 seconds for application to fully start..."
    sleep 5
    
    # Check homepage
    log "Checking homepage: $BASE_URL"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        success "Homepage responding (HTTP $HTTP_CODE)"
    else
        warn "Homepage check failed (HTTP $HTTP_CODE)"
    fi
    
    # Check API
    log "Checking API: $BASE_URL/api/health"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        success "API responding (HTTP $HTTP_CODE)"
    else
        warn "API check failed (HTTP $HTTP_CODE)"
    fi
    
    # Check auth endpoint
    log "Checking auth endpoint: $BASE_URL/api/auth/login"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/login" || echo "000")
    if [ "$HTTP_CODE" = "405" ] || [ "$HTTP_CODE" = "400" ]; then
        success "Auth endpoint responding (HTTP $HTTP_CODE)"
    else
        warn "Auth endpoint check returned HTTP $HTTP_CODE"
    fi
}

# =============================================================================
# Summary and Next Steps
# =============================================================================

show_summary() {
    log_section "Setup Complete!"
    
    echo ""
    echo -e "${GREEN}${BOLD}✓ Kids Athletics Club setup completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Configuration Summary:${NC}"
    echo -e "  • Domain: ${BOLD}$DOMAIN${NC}"
    echo -e "  • Base URL: ${BOLD}$BASE_URL${NC}"
    echo -e "  • Database: ${BOLD}$DB_NAME${NC} on ${BOLD}$DB_HOST:$DB_PORT${NC}"
    echo -e "  • Application Directory: ${BOLD}$SCRIPT_DIR${NC}"
    echo -e "  • Environment File: ${BOLD}server/.env.production${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Default SuperAdmin Account:${NC}"
    echo -e "  • Email: ${BOLD}admin@clubatletism.ro${NC}"
    echo -e "  • Password: ${BOLD}admin123${NC}"
    echo -e "  ${YELLOW}⚠ IMPORTANT: Change this password immediately after first login!${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Next Steps:${NC}"
    echo ""
    echo -e "  1. ${BOLD}Test the application:${NC}"
    echo -e "     ${BLUE}$BASE_URL${NC}"
    echo ""
    echo -e "  2. ${BOLD}Login as SuperAdmin:${NC}"
    echo -e "     Email: admin@clubatletism.ro"
    echo -e "     Password: admin123"
    echo ""
    echo -e "  3. ${BOLD}Change admin password immediately!${NC}"
    echo ""
    echo -e "  4. ${BOLD}Deploy updates in the future:${NC}"
    echo -e "     ${GREEN}git pull origin main && touch tmp/restart.txt${NC}"
    echo ""
    echo -e "  5. ${BOLD}Check logs:${NC}"
    echo -e "     ${GREEN}tail -f logs/production.log${NC}"
    echo -e "     OR"
    echo -e "     ${GREEN}pm2 logs $APP_NAME${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Useful Commands:${NC}"
    echo ""
    echo -e "  • Restart app: ${GREEN}touch tmp/restart.txt${NC} (Passenger)"
    echo -e "  • Restart app: ${GREEN}pm2 restart $APP_NAME${NC} (PM2)"
    echo -e "  • View logs: ${GREEN}tail -f $LOG_FILE${NC}"
    echo -e "  • Health check: ${GREEN}curl $BASE_URL/api/health${NC}"
    echo -e "  • Reset permissions: ${GREEN}curl $BASE_URL/api/setup/initialize-data?reset_permissions=true${NC}"
    echo ""
    echo -e "${CYAN}${BOLD}Documentation:${NC}"
    echo -e "  • Setup log: ${BOLD}$LOG_FILE${NC}"
    echo -e "  • Deployment guide: ${BOLD}DEPLOYMENT-GUIDE.md${NC}"
    echo -e "  • README: ${BOLD}README.md${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}Happy coaching! 🏃‍♂️⚡${NC}"
    echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    clear
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║         Kids Athletics Club - Server Setup Script                        ║
║                                                                           ║
║         Automated setup for web server deployment                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    log "Setup started at $(date)"
    log "Script directory: $SCRIPT_DIR"
    
    # Run setup steps
    check_prerequisites
    detect_environment
    configure_database
    generate_jwt_secret
    create_env_file
    install_dependencies
    initialize_database
    setup_directories
    verify_builds
    configure_webserver
    initialize_permissions
    run_health_checks
    show_summary
    
    log "Setup completed at $(date)"
}

# Run main function
main "$@"
