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
