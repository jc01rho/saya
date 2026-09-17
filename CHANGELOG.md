# 변경 기록

[Keep a Changelog](https://keepachangelog.com/ko/1.1.0/) 형식을 따르고,
버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다. 0.x 에서는 부 버전
증가가 기능 추가와 깨질 수 있는 변화를 함께 뜻합니다.

## [Unreleased]

### 추가

- 저장소를 세웠습니다. 아직 구현은 없고, 무엇을 만들지와 그 근거가 들어 있습니다 —
  `BRIEF.md`, `PROTOCOL.md`, `AGENTS.md`, 그리고 두 코어가 자기 합성 픽스처로 뽑은
  봉투 샘플 16개(`tests/fixtures/envelopes/`).

  HTTP 계층의 원본은 `sanguneo/kanao-cli` PR #1(작성자 `jc01rho`)입니다. 거기서는
  kanao 안의 서브커맨드였고, 여기서는 코어를 import 하지 않고 **spawn 만** 하도록
  백엔드만 바뀝니다. 그래야 복호화 키가 이 프로세스에 들어오지 않고, 두 코어가 내건
  "읽기는 네트워크를 쓰지 않는다"가 검증 가능한 상태로 남으며, 코드 하나가 Windows와
  macOS를 함께 섬깁니다.
