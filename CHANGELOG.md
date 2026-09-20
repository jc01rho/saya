# 변경 기록

[Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식을 따르고,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다. 0.x 에서는 부 버전
증가가 기능 추가와 깨질 수 있는 변화를 함께 뜻합니다.

## [Unreleased]

### 변경

- **저장소를 웹 클라이언트로 다시 시작했습니다.** 여기까지 이 저장소는 두 CLI를 spawn
  하는 HTTP 래퍼의 계획이었습니다. 코어 안에 `serve` 가 들어간 뒤로 래퍼는 이미 있는
  표면을 한 겹 더 감싸는 일이 됐고, 정작 없는 것은 그 표면을 쓰는 화면이었습니다.

  그래서 남긴 것은 `README.md`, `BRIEF.md`, `AGENTS.md`, `LICENSE`, PR 템플릿,
  그리고 두 코어가 바이트 단위로 공유하는 `openapi.json` 입니다. 래퍼를 전제로 쓰인
  `PORTING.md`·`PROTOCOL.md`·`pyproject.toml`·CLI 봉투 픽스처는 지웠습니다 — git 이력
  `8a5d251` 에 그대로 있습니다.

  새 방향은 서버를 만들지 않습니다. 계약은 `openapi.json` 하나이고, 이 저장소는 그것을
  쓰는 화면만 만듭니다.
