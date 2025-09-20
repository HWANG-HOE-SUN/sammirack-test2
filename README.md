# sammirack-test2

sammirack-estimator/                    # 기존 GitHub 프로젝트 루트
├── src/                                # 기존 React 소스
├── public/                             # 기존 퍼블릭 파일
├── package.json                        # 기존 프론트엔드 package.json
├── README.md                          # 기존 README
│
├── backend/                           # 🆕 새로 추가할 백엔드 폴더
│   ├── package.json                   # 백엔드 의존성
│   ├── server.js                      # 메인 서버 파일
│   ├── Dockerfile                     # 백엔드 도커 이미지 설정
│   ├── .env.example                   # 환경변수 예시
│   ├── .env                          # 실제 환경변수 (gitignore)
│   ├── uploads/                       # 업로드 파일 저장소
│   ├── logs/                         # 로그 파일
│   └── scripts/                      # 데이터베이스 스크립트
│       ├── schema.sql                # DB 스키마
│       └── initial-data.sql          # 초기 데이터
│
├── docker-compose.yml                 # 🆕 도커 컴포즈 설정
├── docker-compose.prod.yml            # 🆕 프로덕션 도커 설정
├── Dockerfile.frontend                # 🆕 프론트엔드 도커 이미지
├── .dockerignore                      # 🆕 도커 무시 파일
│
├── nginx/                             # 🆕 nginx 설정 (프로덕션용)
│   ├── nginx.conf                     # nginx 메인 설정
│   ├── default.conf                   # 사이트 설정
│   └── ssl/                          # SSL 인증서 (선택사항)
│
├── scripts/                           # 🆕 자동화 스크립트
│   ├── setup.sh                      # 초기 설정 스크립트
│   ├── deploy.sh                      # 배포 스크립트
│   ├── backup.sh                      # 백업 스크립트
│   ├── restore.sh                     # 복원 스크립트
│   ├── health-check.sh                # 상태 확인
│   └── monitor.sh                     # 모니터링
│
├── backups/                           # 🆕 백업 파일 저장소
├── logs/                              # 🆕 시스템 로그
│
├── .env.example                       # 🆕 전체 환경변수 예시
├── .env                              # 🆕 실제 환경변수 (gitignore)
└── .gitignore                        # 업데이트 필요
