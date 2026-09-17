# 봉투 샘플

`kanao-cli` 와 `kamado-cli` 가 **실제로 찍는** 출력입니다. 각 8개씩.

두 코어 저장소의 `tests/fixtures.py` — 합성 데이터 — 로 만들어졌습니다. **실제 계정은 한
번도 읽지 않았고**, 그래서 커밋할 수 있습니다. 안에 보이는 `Peer Renamed`, `Huge Id User`,
1970년 타임스탬프가 그 증거입니다.

## 왜 여기 있나

이 래퍼는 봉투를 **해석하지 않고 중계**합니다. 그게 맞다는 걸 확인하려면 진짜 출력이
필요한데, 매번 두 클라이언트를 띄울 수는 없습니다. 특히 **macOS 없이 kamado 호환을
검증할 수 있는 유일한 수단**입니다.

## 두 갈래의 차이 (측정값)

```
context   kamado-only=['room.typeCode']     error_chat_not_found   same
digest    kamado-only=['room.typeCode']     error_invalid_request  same
messages  kamado-only=['room.typeCode']     follow_message         same
rooms     kamado-only=['rooms.typeCode']    follow_watching        same
```

8개 전부 키 집합이 같고 차이는 `typeCode` 하나입니다. 에러 코드는 kamado에
`PERMISSION_REQUIRED` 하나 더 있습니다. 그래서 "모르는 키 무시 · 모르는 에러 코드는
default 분기" 두 줄이면 하나의 코드가 양쪽을 섬깁니다.

## 갱신

각 코어 저장소에서 다시 뽑아 여기로 복사합니다. 손으로 고치지 마세요.

```bash
# kanao-cli (Windows)
python -m tests.test_protocol --write
# kamado-cli (macOS, 또는 WSL에서 테스트 목적으로)
python3 -m tests.test_protocol --write
```

코어 쪽에서도 같은 샘플을 pin 하는 테스트가 돌고 있어서, 봉투가 바뀌면 **소비자가 아니라
그 저장소에서 먼저** 깨집니다.

## 한 가지 예외

`follow_watching.json` 은 캡처가 아니라 `cli._follow` 와 같은 방식으로 재구성한 것입니다.
끝나지 않는 루프를 돌려야 캡처되기 때문입니다. `follow_message.json` 은 실제
`Message.as_json()` 을 써서 진짜로 고정됩니다.
