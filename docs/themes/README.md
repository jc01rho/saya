# 테마 모음

바로 붙여 넣어 쓸 수 있는 테마 JSON 모음입니다. 테마 JSON의 모양과 규칙은 [THEMES.md](../THEMES.md)에 있습니다.

## 앱에서 고르기

테마 버튼(반원 아이콘) → **테마 모음**에서 카드를 누르면, 그림이 들어간 테마(`-img`)를 저장하고 바로 적용합니다.
같은 카드를 다시 누르면 같은 이름의 테마를 덮어씁니다. 직접 만든 테마와 같은 칸에 저장되므로 20개 한도도 같습니다.
카드 목록(`gallery.json`)만 앱에 들어가고, 테마 파일은 빌드 때 `dist/themes/`로 복사돼 카드를 누를 때만 받습니다.

### 모음에 테마 더하기: 목록 1줄 + JSON 4개

1. `docs/themes/<id>/`에 JSON 4개를 넣습니다: `<id>-light.json`, `<id>-dark.json`(색 전용), `<id>-light-img.json`, `<id>-dark-img.json`(그림판).
2. [`gallery.json`](gallery.json)에 캐릭터 한 줄을 더합니다. 카드는 그림판 두 개입니다.

   ```json
   { "id": "<id>", "name": "<캐릭터>", "themes": [{ "mode": "light", "name": "<light-img의 name>", "colors": ["<wall>", "<bubbleSelf>", "<accent>", "<text>"], "path": "<id>/<id>-light-img.json" }, { "mode": "dark", ... }] }
   ```

   `name`·`mode`·`colors`는 그 JSON의 값을 그대로 옮깁니다(`colors`는 `tokens`의 `wall`·`bubbleSelf`·`accent`·`text` 순서).
3. 이 README의 표와 출처를 채웁니다.

`bun test tests/theme/gallery.test.ts`가 모든 JSON의 검증·대비 경고 0과, 목록 줄의 이름·모드·색·경로가 실제 JSON과 같은지 확인합니다. 틀리면 어느 줄인지 알려 줍니다.

## 붙여넣는 법

1. 아래 표에서 테마 파일을 열고 내용 전체를 복사합니다.
2. 방 목록 머리의 테마 버튼(반원 아이콘) → **테마 만들기**의 **테마 붙여넣기** 칸에 넣고 **확인**을 누릅니다.
3. 미리보기를 보고 **저장하고 적용**을 누릅니다.

그림이 들어간 테마(`-img`)는 그림을 지원하는 saya에서만 그림까지 나옵니다. 그림 기능이 없는 버전에 붙여 넣으면 `images`는 무시되고 색만 적용됩니다.

모든 파일은 `tests/theme/gallery.test.ts`가 앱의 검증기(`parseTheme`)로 확인합니다. 오류와 대비 경고는 모두 0입니다.

## 우사기 (`usagi/`)

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [usagi-light.json](usagi/usagi-light.json) | 우사기 크림 🐰 | light | 없음(색만) |
| [usagi-dark.json](usagi/usagi-dark.json) | 우사기 밤산책 🐰 | dark | 없음(색만) |
| [usagi-light-img.json](usagi/usagi-light-img.json) | 우사기 크림 그림 🐰 | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [usagi-dark-img.json](usagi/usagi-dark-img.json) | 우사기 밤산책 그림 🐰 | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

미리보기(목업 데이터)는 이 테마들을 올린 풀 리퀘스트에 넓은 화면과 폰 폭 캡처로 붙어 있습니다.

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- 색은 아래 공식 그림에서 뽑았습니다. 그림 테마(`-img`)의 그림도 같은 곳에서 가져왔습니다.
  - LINE STORE 공식 스티커 「ちいかわ(うさぎ多)」(작가 ナガノ) 미리보기 그림
  - 공식 굿즈샵 ちいかわマーケット 상품 그림
  - 로딩 그림: LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ vol.1」 스티커 805188761
    (https://store.line.me/stickershop/product/32367501/ja)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.

## 하치와레 (`hachiware/`)

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [hachiware-light.json](hachiware/hachiware-light.json) | 하치와레 하늘 🐱 | light | 없음(색만) |
| [hachiware-dark.json](hachiware/hachiware-dark.json) | 하치와레 밤하늘 🐱 | dark | 없음(색만) |
| [hachiware-light-img.json](hachiware/hachiware-light-img.json) | 하치와레 하늘 그림 🐱 | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [hachiware-dark-img.json](hachiware/hachiware-dark-img.json) | 하치와레 밤하늘 그림 🐱 | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- 색과 그림 테마(`-img`)의 그림은 아래 공식 그림에서 가져왔습니다.
  - LINE STORE 공식 스티커 「ちいかわ(ハチワレ多)」(작가 ナガノ) 미리보기 그림
    (https://store.line.me/stickershop/product/29118925/ja)
  - 공식 굿즈샵 ちいかわマーケット 상품 그림 (https://chiikawamarket.jp)
  - 로딩 그림: LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ vol.1」 스티커 805188752
    (https://store.line.me/stickershop/product/32367501/ja)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.

## 치이카와 (`chiikawa/`)

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [chiikawa-light.json](chiikawa/chiikawa-light.json) | 치이카와 딸기우유 🐹 | light | 없음(색만) |
| [chiikawa-dark.json](chiikawa/chiikawa-dark.json) | 치이카와 코코아 🐹 | dark | 없음(색만) |
| [chiikawa-light-img.json](chiikawa/chiikawa-light-img.json) | 치이카와 딸기우유 그림 🐹 | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [chiikawa-dark-img.json](chiikawa/chiikawa-dark-img.json) | 치이카와 코코아 그림 🐹 | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- 색과 그림 테마(`-img`)의 그림은 아래 공식 그림에서 가져왔습니다.
  - LINE STORE 공식 스티커 「ちいかわ(ちいかわ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/25264193/ja)
  - LINE STORE 공식 스티커 「ちいかわ(モモンガ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/32411274/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.2 미리보기 그림 (https://store.line.me/stickershop/product/32855985/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.3 미리보기 그림 (https://store.line.me/stickershop/product/32855981/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.4 미리보기 그림 (https://store.line.me/stickershop/product/33799640/ja)
  - 공식 굿즈샵 ちいかわマーケット 상품 그림 (https://chiikawamarket.jp)
  - 로딩 그림: LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ vol.2」 스티커 816451476
    (https://store.line.me/stickershop/product/32855985/ja)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.

## 모몽가 (`momonga/`)

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [momonga-light.json](momonga/momonga-light.json) | 모몽가 솜사탕 🐿️ | light | 없음(색만) |
| [momonga-dark.json](momonga/momonga-dark.json) | 모몽가 한밤 🐿️ | dark | 없음(색만) |
| [momonga-light-img.json](momonga/momonga-light-img.json) | 모몽가 솜사탕 그림 🐿️ | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [momonga-dark-img.json](momonga/momonga-dark-img.json) | 모몽가 한밤 그림 🐿️ | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- 색과 그림 테마(`-img`)의 그림은 아래 공식 그림에서 가져왔습니다.
  - LINE STORE 공식 스티커 「ちいかわ(モモンガ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/32411274/ja)
  - LINE STORE 공식 스티커 「ちいかわ(ちいかわ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/25264193/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.2 미리보기 그림 (https://store.line.me/stickershop/product/32855985/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.1 미리보기 그림 (https://store.line.me/stickershop/product/32367501/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.4 미리보기 그림 (https://store.line.me/stickershop/product/33799640/ja)
  - 공식 굿즈샵 ちいかわマーケット 상품 그림 (https://chiikawamarket.jp)
  - 로딩 그림: LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ vol.2」 스티커 816451467
    (https://store.line.me/stickershop/product/32855985/ja)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.

## 밤만쥬 (`kurimanju/`)

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [kurimanju-light.json](kurimanju/kurimanju-light.json) | 밤만쥬 밤과자 🌰 | light | 없음(색만) |
| [kurimanju-dark.json](kurimanju/kurimanju-dark.json) | 밤만쥬 선술집 🌰 | dark | 없음(색만) |
| [kurimanju-light-img.json](kurimanju/kurimanju-light-img.json) | 밤만쥬 밤과자 그림 🌰 | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [kurimanju-dark-img.json](kurimanju/kurimanju-dark-img.json) | 밤만쥬 선술집 그림 🌰 | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- 색과 그림 테마(`-img`)의 그림은 아래 공식 그림에서 가져왔습니다.
  - LINE STORE 공식 스티커 「ちいかわ(ちいかわ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/25264193/ja)
  - LINE STORE 공식 스티커 「ちいかわ(モモンガ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/32411274/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.2 미리보기 그림 (https://store.line.me/stickershop/product/32855985/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.1 미리보기 그림 (https://store.line.me/stickershop/product/32367501/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.4 미리보기 그림 (https://store.line.me/stickershop/product/33799640/ja)
  - 공식 굿즈샵 ちいかわマーケット 상품 그림 (https://chiikawamarket.jp)
  - 로딩 그림: LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ vol.1」 스티커 805188758
    (https://store.line.me/stickershop/product/32367501/ja)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.

## 갑옷 씨(관리인) (`yoroi/`)

'관리인'은 공식 이름이 아니라 팬 호칭입니다. 치이카와 일행에게 일을 맡기고 생활을 돕는 갑옷 씨(鎧さん)로 보고 만들었습니다.

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [yoroi-light.json](yoroi/yoroi-light.json) | 갑옷 씨(관리인) 은빛 🛡️ | light | 없음(색만) |
| [yoroi-dark.json](yoroi/yoroi-dark.json) | 갑옷 씨(관리인) 야간근무 🛡️ | dark | 없음(색만) |
| [yoroi-light-img.json](yoroi/yoroi-light-img.json) | 갑옷 씨(관리인) 낮 🛡️ | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [yoroi-dark-img.json](yoroi/yoroi-dark-img.json) | 갑옷 씨(관리인) 밤 🛡️ | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- 색과 그림 테마(`-img`)의 그림은 아래 공식 그림에서 가져왔습니다.
  - LINE STORE 공식 스티커 「ちいかわ(モモンガ多)」(작가 ナガノ) 미리보기 그림 (https://store.line.me/stickershop/product/32411274/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.3 미리보기 그림 (https://store.line.me/stickershop/product/32855981/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.1 미리보기 그림 (https://store.line.me/stickershop/product/32367501/ja)
  - LINE STORE 공식 「アニメ『ちいかわ』動くLINEスタンプ」 vol.4 미리보기 그림 (https://store.line.me/stickershop/product/33799640/ja)
  - 공식 굿즈샵 ちいかわマーケット 상품 그림 (https://chiikawamarket.jp)
  - 로딩 그림('유산균 춤'): TV 아니메 『ちいかわ』 第175話「ちいかわの夢④」에서 갑옷 씨들이 「むちゃうマンのテーマ」에 맞춰 춤추는 장면의 프레임
    (공식 X 공지 https://x.com/anime_chiikawa/status/1802536653807817114 , 공식 YouTube 1주 한정 공개분 https://www.youtube.com/watch?v=BuA-LzmXnqk 는 지금 비공개라 archive.org 미러 https://archive.org/details/chiikawa-anime-ep175 에서 받음)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.

## 유산균 (`yusangyun/`)

'유산균'은 팬 호칭입니다. 아니메 『ちいかわ』의 요구르트 히어로 むちゃうマン(노래 「むちゃうマンのテーマ」의 "乳酸菌 乳酸菌")으로 보고 만들었습니다.

| 파일 | 이름 | 모드 | 그림 |
| --- | --- | --- | --- |
| [yusangyun-light.json](yusangyun/yusangyun-light.json) | 유산균 무대 🥛 | light | 없음(색만) |
| [yusangyun-dark.json](yusangyun/yusangyun-dark.json) | 유산균 한밤 무대 🥛 | dark | 없음(색만) |
| [yusangyun-light-img.json](yusangyun/yusangyun-light-img.json) | 유산균 무대 그림 🥛 | light | 벽지·목록 무늬·마스코트·배지·로딩 |
| [yusangyun-dark-img.json](yusangyun/yusangyun-dark-img.json) | 유산균 한밤 무대 그림 🥛 | dark | 벽지·목록 무늬·마스코트·배지·로딩 |

### 저작권과 출처

- 팬 메이드·비공식·비영리 테마입니다. 원작자나 공식 측과 관계가 없습니다.
- 「ちいかわ」 © nagano / chiikawa committee
- むちゃうマン은 단독 LINE 스티커가 없습니다. 그래서 색과 그림 테마(`-img`)의 그림(로딩 그림 포함)은 아래 공식 방송분 프레임에서 가져왔습니다.
  - TV 아니메 『ちいかわ』 第138話「むちゃうマン②」(공식 YouTube 1주 한정 공개분 https://www.youtube.com/watch?v=XQgWOBWmsuk, 지금은 비공개라 archive.org 미러 https://archive.org/details/chiikawa-anime-ep138 에서 받음)
  - 색 확인: 공식 굿즈샵 ちいかわマーケット むちゃうマン 상품 그림 (https://chiikawamarket.jp)
- 그림 테마는 공식 그림을 담고 있습니다. 아는 사람끼리 비영리로만 나눠 쓰고, 다른 곳에 다시 올리지 마세요.
