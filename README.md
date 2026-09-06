# Creator Revenue Bridge

크리에이터의 미래 플랫폼 수익을 수익청구권으로 구조화해 선지급 자금을 연결하는 RWA 프로젝트입니다.

## 프로젝트 구성

- `frontend`: Next.js 기반 웹 애플리케이션
- `backend`: Spring Boot 기반 API 서버
- `contracts`: Ethereum L2에 배포할 Foundry 기반 스마트 컨트랙트

## 개발 요구 사항

- Node.js 20.9 이상
- Java 21
- Foundry 1.8 계열

## 실행

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

Windows:

```powershell
cd backend
.\gradlew.bat bootRun
```

macOS/Linux:

```bash
cd backend
./gradlew bootRun
```

### Contracts

```bash
cd contracts
forge build
forge test
```
