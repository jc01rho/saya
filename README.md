# hinokami-kagura

`kanao-cli`(Windows)와 `kamado-cli`(macOS)를 **HTTP + SSE로 감싸는 외부 래퍼**입니다.
리눅스나 다른 머신에서 카카오톡을 읽고, 요약을 받고, 새 메시지를 스트림으로 따라가고,
명시적으로 보낼 수 있게 합니다.

```
hinokami-kagura serve --cli "python -m kanao" --token <16자 이상>
```

아직 **구현 전**입니다. 이 저장소에는 무엇을 만들지와 그 근거가 들어 있습니다.
시작하려면 [`BRIEF.md`](BRIEF.md) 를 읽으세요.

## 한 가지 성질이 이 저장소의 존재 이유입니다

**코어를 import 하지 않고 spawn 만 합니다.**

```
hinokami-kagura  ──subprocess──>  kanao / kamado  ──>  카카오톡 로컬 DB
     (HTTP)                          (JSON)
```

그래서:

- **복호화 키를 이 프로세스가 절대 쥐지 않습니다.** SQLCipher 키는 요청 동안 떴다 죽는
  자식 프로세스 안에만 있고, 래퍼는 자식이 뱉은 JSON만 봅니다. 원격으로 열어두는 서버가
  가져야 할 성질이라고 봅니다.
- **두 코어의 약속이 그대로 유지됩니다.** 두 저장소 모두 "읽기는 네트워크를 쓰지 않는다"를
  내걸고 있고, 소켓을 여는 코드가 그 안에 들어가면 그 문장이 거짓이 됩니다. 여기 있으면
  `grep` 으로 검증되는 진술로 남습니다.
- **하나의 코드가 두 플랫폼을 섬깁니다.** 두 CLI의 봉투를 실제로 대조해 보면 샘플 8개가
  전부 같은 키를 쓰고 차이는 `room.typeCode` 하나뿐입니다
  ([`tests/fixtures/envelopes/`](tests/fixtures/envelopes/)). 바이너리 이름만 바꾸면 됩니다.

`kanao`/`kamado` 를 import 하지 않는다는 건 **테스트로 강제**할 것입니다(`BRIEF.md` 참고).

## macOS 없이 개발할 수 있습니다

`kamado` 를 import 하지 않고 spawn 만 하므로, macOS 지원은 "다른 바이너리 이름" 이상이
아닙니다. 그리고 두 코어가 자기 합성 픽스처로 뽑은 봉투 샘플이
[`tests/fixtures/envelopes/`](tests/fixtures/envelopes/) 에 커밋돼 있어서, **맥 없이 그 파일들로
호환성을 검증**할 수 있습니다. 맥 실기 확인(spawn 비용 측정 포함)은 그 머신을 가진 쪽이
나중에 합니다.

일단 Windows + `kanao` 만 보고 만들어도 됩니다.

## 문서

| 파일 | 내용 |
| --- | --- |
| [`BRIEF.md`](BRIEF.md) | **무엇을 만들 것인가** — 엔드포인트 매핑, 원본 코드에서 살릴 것/바꿀 것, 플랫폼 함정 |
| [`PROTOCOL.md`](PROTOCOL.md) | 두 CLI가 내는 봉투. 소비자가 의존해도 되는 것과 아닌 것 |
| [`AGENTS.md`](AGENTS.md) | 이 저장소에서 일하는 규칙 |
| [`tests/fixtures/envelopes/`](tests/fixtures/envelopes/) | 두 코어의 실제 출력 샘플 16개. 준수 테스트의 근거 |

## 출처

HTTP 계층의 원본은 `sanguneo/kanao-cli` PR #1(작성자 `jc01rho`)입니다. 거기서는 kanao 안에
들어가는 서브커맨드였고, 여기서는 백엔드만 subprocess 호출로 바뀝니다. 그 PR의
`build_handler` — 인증·body framing·rate limiting·SSE — 는 **거의 그대로 쓰입니다.**

## 라이선스

MIT. [LICENSE](LICENSE) 참조.
