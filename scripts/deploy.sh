#!/bin/bash
# scripts/deploy.sh - 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 함수 정의
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "사용법: $0 <백업파일경로>"
    echo ""
    echo "사용 가능한 백업 파일:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "백업 파일이 없습니다."
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "백업 파일을 찾을 수 없습니다: $BACKUP_FILE"
    exit 1
fi

# 환경 변수 로드
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

log_warning "⚠️ 데이터베이스 복원을 시작합니다."
log_warning "현재 데이터가 모두 삭제되고 백업 데이터로 대체됩니다."
read -p "계속하시겠습니까? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    log_info "복원이 취소되었습니다."
    exit 0
fi

# MySQL 컨테이너 상태 확인
if ! docker-compose ps mysql | grep -q "Up"; then
    log_error "MySQL 컨테이너가 실행 중이 아닙니다."
    exit 1
fi

log_info "🔄 데이터베이스 복원 중..."

# 압축 파일인지 확인하고 적절히 처리
if [[ "$BACKUP_FILE" == *.gz ]]; then
    zcat "$BACKUP_FILE" | docker-compose exec -T mysql mysql \
        -u root -p${DB_ROOT_PASSWORD:-secure_root_password} \
        ${DB_NAME:-rack_management}
else
    cat "$BACKUP_FILE" | docker-compose exec -T mysql mysql \
        -u root -p${DB_ROOT_PASSWORD:-secure_root_password} \
        ${DB_NAME:-rack_management}
fi

if [ $? -eq 0 ]; then
    log_info "✅ 데이터베이스 복원 완료!"
else
    log_error "❌ 데이터베이스 복원 실패!"
    exit 1
fi
RESTORE_SCRIPT

chmod +x scripts/restore.sh

# =====================================
# scripts/health-check.sh - 헬스체크 스크립트
# =====================================

cat > scripts/health-check.sh << 'HEALTH_SCRIPT'
#!/bin/bash
# scripts/health-check.sh - 시스템 상태 확인 스크립트

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 환경 변수 로드
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🏥 랙 관리 시스템 상태 점검"
echo "=================================="

# 1. Docker 컨테이너 상태 확인
log_info "1. Docker 컨테이너 상태 확인"
echo ""
docker-compose ps
echo ""

# 2. 서비스별 헬스체크
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" -eq "$expected_status" ]; then
        log_success "$service_name: 정상 (HTTP $status_code)"
        return 0
    else
        log_error "$service_name: 비정상 (HTTP $status_code)"
        return 1
    fi
}

log_info "2. 서비스 헬스체크"

# 백엔드 API 확인
check_service "백엔드 API" "http://localhost:${BACKEND_PORT:-3001}/api/health"

# 프론트엔드 확인 (있는 경우)
if docker-compose ps frontend | grep -q "Up"; then
    check_service "프론트엔드" "http://localhost:${FRONTEND_PORT:-3000}"
fi

# Nginx 확인 (있는 경우)
if docker-compose ps nginx | grep -q "Up"; then
    check_service "Nginx" "http://localhost:${NGINX_PORT:-80}"
fi

echo ""

# 3. 데이터베이스 연결 확인
log_info "3. 데이터베이스 연결 확인"

if docker-compose exec mysql mysqladmin -u root -p${DB_ROOT_PASSWORD:-secure_root_password} ping --silent; then
    log_success "MySQL: 연결 정상"
    
    # 테이블 수 확인
    table_count=$(docker-compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD:-secure_root_password} \
        -D ${DB_NAME:-rack_management} -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME:-rack_management}';" \
        2>/dev/null | tail -n 1 | tr -d '\r')
    
    log_info "데이터베이스 테이블 수: $table_count"
else
    log_error "MySQL: 연결 실패"
fi

# 4. Redis 연결 확인 (있는 경우)
if docker-compose ps redis | grep -q "Up"; then
    log_info "4. Redis 연결 확인"
    
    if docker-compose exec redis redis-cli -a ${REDIS_PASSWORD:-redis_password} ping | grep -q "PONG"; then
        log_success "Redis: 연결 정상"
    else
        log_error "Redis: 연결 실패"
    fi
fi

echo ""

# 5. 디스크 사용량 확인
log_info "5. 디스크 사용량 확인"
df -h | grep -E "(Filesystem|/dev/)"
echo ""

# 6. 메모리 사용량 확인
log_info "6. 시스템 리소스 사용량"
echo "메모리 사용량:"
free -h
echo ""
echo "Docker 리소스 사용량:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""

# 7. 최근 로그 확인
log_info "7. 최근 에러 로그 확인"

# 백엔드 에러 로그
backend_errors=$(docker-compose logs backend --tail=100 2>/dev/null | grep -i error | wc -l)
if [ "$backend_errors" -gt 0 ]; then
    log_warning "백엔드 에러 로그: $backend_errors 개"
    docker-compose logs backend --tail=5 | grep -i error || true
else
    log_success "백엔드: 최근 에러 없음"
fi

echo ""

# 8. 백업 상태 확인
log_info "8. 백업 상태 확인"

if [ -d "./backups" ]; then
    backup_count=$(ls -1 ./backups/*.sql.gz 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        latest_backup=$(ls -t ./backups/*.sql.gz 2>/dev/null | head -n 1)
        backup_date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$latest_backup" 2>/dev/null || stat -c "%y" "$latest_backup" 2>/dev/null | cut -d' ' -f1,2 | cut -d: -f1,2)
        log_success "백업: $backup_count 개 파일, 최신: $backup_date"
    else
        log_warning "백업: 백업 파일 없음"
    fi
else
    log_warning "백업: 백업 디렉토리 없음"
fi

echo ""
echo "=================================="
echo "🏥 상태 점검 완료"
HEALTH_SCRIPT

chmod +x scripts/health-check.sh

# =====================================
# scripts/monitor.sh - 모니터링 스크립트
# =====================================

cat > scripts/monitor.sh << 'MONITOR_SCRIPT'
#!/bin/bash
# scripts/monitor.sh - 실시간 모니터링 스크립트

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
log_success() { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"; }
log_error() { echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"; }

# 환경 변수 로드
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

MONITOR_INTERVAL=${MONITOR_INTERVAL:-30}
LOG_FILE="./logs/monitor_$(date +%Y%m%d).log"

mkdir -p ./logs

echo "🔍 랙 관리 시스템 실시간 모니터링 시작"
echo "모니터링 간격: ${MONITOR_INTERVAL}초"
echo "로그 파일: $LOG_FILE"
echo "중지하려면 Ctrl+C를 누르세요"
echo ""

# 트랩 설정 (Ctrl+C 처리)
trap 'echo ""; log_info "모니터링을 중지합니다."; exit 0' INT

monitor_loop() {
    while true; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        # 컨테이너 상태 확인
        containers_status=$(docker-compose ps --services --filter "status=running" | wc -l)
        total_containers=$(docker-compose ps --services | wc -l)
        
        # API 상태 확인
        api_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${BACKEND_PORT:-3001}/api/health" 2>/dev/null || echo "000")
        
        # 데이터베이스 상태 확인
        db_status="❌"
        if docker-compose exec mysql mysqladmin -u root -p${DB_ROOT_PASSWORD:-secure_root_password} ping --silent 2>/dev/null; then
            db_status="✅"
        fi
        
        # 메모리 사용량 확인
        memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
        
        # 디스크 사용량 확인
        disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        
        # 로그 출력
        status_line="[$timestamp] 컨테이너: $containers_status/$total_containers | API: $api_status | DB: $db_status | 메모리: ${memory_usage}% | 디스크: ${disk_usage}%"
        
        echo "$status_line"
        echo "$status_line" >> "$LOG_FILE"
        
        # 경고 조건 확인
        if [ "$api_status" != "200" ]; then
            log_error "API 서버 응답 없음!"
            echo "[$timestamp] ERROR: API 서버 응답 없음!" >> "$LOG_FILE"
        fi
        
        if [ "$db_status" = "❌" ]; then
            log_error "데이터베이스 연결 실패!"
            echo "[$timestamp] ERROR: 데이터베이스 연결 실패!" >> "$LOG_FILE"
        fi
        
        if [ "$memory_usage" != "" ] && [ "${memory_usage%.*}" -gt 90 ]; then
            log_warning "메모리 사용량 높음: ${memory_usage}%"
            echo "[$timestamp] WARNING: 메모리 사용량 높음: ${memory_usage}%" >> "$LOG_FILE"
        fi
        
        if [ "$disk_usage" -gt 85 ]; then
            log_warning "디스크 사용량 높음: ${disk_usage}%"
            echo "[$timestamp] WARNING: 디스크 사용량 높음: ${disk_usage}%" >> "$LOG_FILE"
        fi
        
        sleep "$MONITOR_INTERVAL"
    done
}

monitor_loop
MONITOR_SCRIPT

chmod +x scripts/monitor.sh

log_success "모든 배포 및 관리 스크립트가 생성되었습니다!"

echo ""
echo "📋 생성된 스크립트:"
echo "   - scripts/deploy.sh: 배포 스크립트"
echo "   - scripts/backup.sh: 백업 스크립트"
echo "   - scripts/restore.sh: 복원 스크립트"
echo "   - scripts/health-check.sh: 헬스체크 스크립트"
echo "   - scripts/monitor.sh: 실시간 모니터링 스크립트"NC} $1"; }

# 환경 변수 설정
ENVIRONMENT=${1:-development}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}

log_info "🚀 랙 관리 시스템 배포 시작 (환경: $ENVIRONMENT)"

# 1. 환경 검증
log_info "1. 배포 환경 검증 중..."

if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml 파일을 찾을 수 없습니다."
    exit 1
fi

if [ ! -f ".env" ]; then
    log_warning ".env 파일이 없습니다. .env.example을 복사하여 설정해주세요."
fi

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

log_success "환경 검증 완료"

# 2. 기존 배포 백업 (운영환경만)
if [ "$ENVIRONMENT" = "production" ] && [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
    log_info "2. 배포 전 데이터베이스 백업 중..."
    
    if docker-compose ps mysql | grep -q "Up"; then
        BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
        mkdir -p backups
        
        docker-compose exec -T mysql mysqldump \
            -u root -p${DB_ROOT_PASSWORD:-secure_root_password} \
            --routines --triggers --single-transaction \
            ${DB_NAME:-rack_management} > "backups/backup_before_deploy_${BACKUP_DATE}.sql"
        
        log_success "백업 완료: backups/backup_before_deploy_${BACKUP_DATE}.sql"
    else
        log_warning "MySQL 컨테이너가 실행 중이 아닙니다. 백업을 건너뜁니다."
    fi
fi

# 3. 기존 컨테이너 중지
log_info "3. 기존 서비스 중지 중..."
docker-compose down --remove-orphans

# 4. 최신 이미지 빌드
log_info "4. 애플리케이션 이미지 빌드 중..."

if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose --profile production build --no-cache
else
    docker-compose build --no-cache
fi

log_success "이미지 빌드 완료"

# 5. 서비스 시작
log_info "5. 서비스 시작 중..."

if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose --profile production up -d
else
    docker-compose up -d
fi

# 6. 서비스 상태 확인
log_info "6. 서비스 상태 확인 중..."

sleep 10  # 서비스 시작 대기

# 헬스체크
check_service() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log_success "$service 서비스가 정상적으로 시작되었습니다."
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "$service 서비스 시작 대기 중... ($attempt/$max_attempts)"
        sleep 5
    done
    
    log_error "$service 서비스 시작에 실패했습니다."
    return 1
}

# 백엔드 헬스체크
if ! check_service "백엔드" "http://localhost:${BACKEND_PORT:-3001}/api/health"; then
    log_error "백엔드 서비스 배포 실패"
    exit 1
fi

# 프론트엔드 헬스체크 (프로덕션 환경만)
if [ "$ENVIRONMENT" = "production" ]; then
    if ! check_service "프론트엔드" "http://localhost:${FRONTEND_PORT:-3000}"; then
        log_error "프론트엔드 서비스 배포 실패"
        exit 1
    fi
fi

# 7. 배포 완료 정보 출력
log_success "🎉 배포가 성공적으로 완료되었습니다!"

echo ""
echo "📋 서비스 접속 정보:"
echo "   - 백엔드 API: http://localhost:${BACKEND_PORT:-3001}/api"
echo "   - 프론트엔드: http://localhost:${FRONTEND_PORT:-3000}"
if [ "$ENVIRONMENT" = "production" ]; then
    echo "   - Nginx: http://localhost:${NGINX_PORT:-80}"
fi
echo ""

echo "📊 서비스 상태 확인:"
docker-compose ps

echo ""
echo "📝 유용한 명령어:"
echo "   - 로그 확인: docker-compose logs -f [service_name]"
echo "   - 서비스 재시작: docker-compose restart [service_name]"
echo "   - 서비스 중지: docker-compose down"
echo "   - 백업 실행: ./scripts/backup.sh"
echo ""

# =====================================
# scripts/backup.sh - 백업 스크립트
# =====================================

cat > scripts/backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
# scripts/backup.sh - 데이터베이스 백업 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 환경 변수 로드
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

# 백업 설정
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "🗄️ 데이터베이스 백업 시작..."

# MySQL 컨테이너 상태 확인
if ! docker-compose ps mysql | grep -q "Up"; then
    log_error "MySQL 컨테이너가 실행 중이 아닙니다."
    exit 1
fi

# 데이터베이스 백업
BACKUP_FILE="$BACKUP_DIR/rack_management_backup_$DATE.sql"

log_info "백업 파일: $BACKUP_FILE"

docker-compose exec -T mysql mysqldump \
    -u root -p${DB_ROOT_PASSWORD:-secure_root_password} \
    --routines --triggers --single-transaction --lock-tables=false \
    --add-drop-table --add-locks --create-options --disable-keys \
    --extended-insert --quick --set-charset \
    ${DB_NAME:-rack_management} > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # 백업 파일 압축
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_info "✅ 백업 완료! 파일 크기: $BACKUP_SIZE"
    
    # 파일 업로드 디렉토리도 백업 (있는 경우)
    if [ -d "./backend/uploads" ] && [ "$(ls -A ./backend/uploads)" ]; then
        UPLOADS_BACKUP="$BACKUP_DIR/uploads_backup_$DATE.tar.gz"
        tar -czf "$UPLOADS_BACKUP" -C ./backend uploads/
        log_info "📁 업로드 파일 백업 완료: $UPLOADS_BACKUP"
    fi
    
    # 오래된 백업 파일 정리
    log_info "🧹 오래된 백업 파일 정리 중... (${RETENTION_DAYS}일 이상 된 파일)"
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    
    # 백업 목록 표시
    echo ""
    echo "📋 최근 백업 파일:"
    ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5 || log_warning "백업 파일이 없습니다."
    
else
    log_error "❌ 백업 실패!"
    exit 1
fi
BACKUP_SCRIPT

chmod +x scripts/backup.sh

# =====================================
# scripts/restore.sh - 복원 스크립트
# =====================================

cat > scripts/restore.sh << 'RESTORE_SCRIPT'
#!/bin/bash
# scripts/restore.sh - 데이터베이스 복원 스크립트

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${
