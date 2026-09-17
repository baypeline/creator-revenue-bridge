# 배포 준비 기록

> 기준일: 2026-09-17  
> 범위: Base Sepolia 컨트랙트 배포와 운영 애플리케이션 이미지

## CRB-DEP-001 — 운영 이미지가 로컬 생성 산출물에 의존

- 상태: 부분 해결
- 영향: 깨끗한 GitHub Actions checkout에는 `frontend/src/generated/contracts`와 백엔드 생성 리소스가 없어 운영 이미지 빌드 및 체인 설정 조회가 실패할 수 있음
- 처리: 임의의 canonical deployment manifest에서 양쪽 애플리케이션의 manifest, ABI와 client metadata를 만드는 `scripts/sync-contract-artifacts.sh` 추가
- 남은 작업: Base Sepolia 실제 배포 후 `contracts/deployments/base-sepolia/84532.json` 생성·검토·커밋, CI 이미지 빌드 전에 동기화 명령 실행

## CRB-DEP-002 — 웹 이미지와 테스트넷 배포 순서

- 상태: 운영 절차 확정
- 판단: 서버, Compose와 빈 애플리케이션 배포 기반은 컨트랙트보다 먼저 준비할 수 있으나 현재 프론트엔드는 주소를 빌드에 포함하므로 투자 기능이 동작하는 최종 이미지는 컨트랙트 배포 이후 생성
- 절차: 배포 시뮬레이션과 보안 점검 → 웹 배포 기반 준비 → Base Sepolia 실제 배포 → manifest 검토·커밋 → 최종 이미지 빌드·교체

## CRB-DEP-003 — 개발용 faucet의 운영 노출

- 상태: 미해결
- 영향: 현재 프론트엔드 faucet API는 공개된 Anvil 배포자 키와 unrestricted mint가 가능한 `MockSettlementToken`을 전제로 하므로 운영용 기능으로 사용할 수 없음
- 후속 작업: 운영 빌드에서 로컬 faucet과 관리자 패널 비활성화, Base Sepolia 테스트 토큰 지급 정책과 호출 제한 별도 구성

## CRB-DEP-004 — Base Sepolia 권한 이전

- 상태: 스크립트와 테스트 구성
- 처리: 배포자를 임시 관리자로 사용해 Bridge를 생성한 뒤 관리자·발행자·정산자 역할을 지정 주소에 부여하고 불필요한 배포자 역할 제거
- 검증: 체인 ID 제한, mock 또는 기존 정산 토큰 선택, 코드가 없는 토큰 주소 거부, 최종 역할과 manifest 일치 테스트
- 실제 상태: Base Sepolia에는 아직 배포하지 않음

## CRB-DEP-005 — ERC-1155 수익권 metadata 제공

- 상태: API 구성
- 처리: `/api/revenue-rights/{id}.json`에서 백엔드 상품 정보를 ERC-1155 metadata JSON으로 변환하고 공개 조회 허용
- 호환성: 10진수 ID, `0x` 접두사 16진수 ID와 ERC-1155 클라이언트가 사용하는 64자리 0 채움 16진수 ID 지원
- 캐시 정책: 상품 상태 변경을 반영할 수 있도록 성공 응답을 60초 동안 캐시하고 300초 동안 stale 응답 재검증 허용
- 남은 작업: 운영 백엔드 상품 데이터와 영구 저장 이미지 연결, Base Sepolia 배포 후 실제 지갑·블록 탐색기 metadata 조회 검증

## CRB-DEP-006 — 생성 ABI의 TypeScript 타입 확장

- 상태: 해결
- 영향: JSON으로 생성된 ABI의 `type` 필드가 일반 문자열로 추론되어 Wagmi 다중 조회의 production 타입 검사가 실패
- 처리: 다중 조회에 전달하는 생성 ABI를 Viem `Abi` 타입으로 명시해 동기화 산출물과 Wagmi 입력 타입 연결

## CRB-DEP-007 — CI의 컨트랙트 산출물 의존성

- 상태: 해결
- 영향: 생성 ABI와 배포 정보가 Git에서 제외되어 깨끗한 checkout에서 프론트엔드 검증 불가
- 처리: 공개된 Anvil 주소만 포함한 CI 전용 manifest를 기준으로 ABI와 클라이언트 산출물을 만든 뒤 lint와 production build 실행
- 제한: CI manifest는 컴파일 검증 전용이며 GHCR 운영 이미지에는 Base Sepolia `84532.json`만 사용

## CRB-DEP-008 — 운영 컨테이너 교체 상태 판정

- 상태: 해결
- 영향: 프로세스 실행 여부만으로는 프론트엔드와 백엔드가 실제 요청을 처리할 수 있는지 판정 불가
- 처리: 양쪽 애플리케이션에 revision을 포함하는 health API를 추가하고 운영 Compose의 의존성과 상태 검사에 연결
- 보안 설정: 운영 포트를 기본적으로 loopback에만 바인딩하고 컨테이너 권한 상승 방지 및 로그 파일 크기 제한 구성

## CRB-DEP-009 — 검증되지 않은 체인 주소의 운영 이미지 게시

- 상태: 방지 구성
- 영향: CI용 Anvil 주소로 빌드한 이미지를 운영에 게시하면 Base Sepolia에서 잘못된 컨트랙트 호출 발생
- 처리: `84532.json`의 체인·네트워크·컨트랙트·권한 주소와 비밀 필드 부재를 검증한 경우에만 GHCR 게시 및 서버 배포 작업 개방
- 배포 방식: 커밋 SHA 불변 태그로 frontend와 backend 이미지를 함께 교체하고 health 실패 시 직전 SHA 태그로 복구
