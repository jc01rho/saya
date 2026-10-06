# 업그레이드 가이드: 등록 방식으로 옮기기 (2026-10-06)

saya 0.8.x 까지는 **saya 쪽**(env 와 Caddyfile)에 카카오 코어와 어댑터마다 주소와 토큰을 적었습니다.
이제는 반대입니다. saya 는 등록 토큰 하나(`SAYA_REGISTER_TOKEN`)만 들고, **코어와 어댑터가 saya 를
가리켜 스스로 등록**합니다(규칙: [`docs/register.md`](register.md)).

코드만 업데이트하고 이 가이드를 하지 않으면 **카카오톡과 어댑터가 saya 목록에서 사라집니다.**
되돌릴 수 있게 백업부터 하고, 단계마다 확인합니다.

## 에이전트에게 맡기기

코딩 에이전트에게 이렇게 말하면 됩니다.

> `https://github.com/sanguneo/saya/blob/main/docs/upgrade-registration.md` 를 읽고, 그대로 내 saya 배포를
> 등록 방식으로 옮겨 줘. saya 서버는 `<ssh 주소>`, 코어·어댑터는 `<기계 목록>` 에 있어.

에이전트가 지킬 것:

- **토큰을 화면·로그·커밋 어디에도 출력하지 않는다.** 옮길 때는 파일에서 파일로(`scp`, 리다이렉트) 옮기고,
  확인은 길이나 `***` 가림으로만 한다.
- 고치는 파일은 먼저 `*.bak-register-<시각>` 으로 백업한다.
- 각 단계의 **확인**이 기대와 다르면 다음 단계로 가지 말고 멈춰서 보고한다. 필요하면 맨 아래 **되돌리기**.
- 사람이 직접 해야 하는 일(메신저 로그인 등)은 하지 말고 알린다.

## 0. 지금 무엇이 붙어 있는지 적어 두기

옛 설정이 곧 옮길 목록입니다. saya 서버에서:

```sh
# 어댑터 id 와 주소 (토큰 값은 가린다)
sed -E 's/(TOKEN=).*/\1***/' <saya env 파일>          # 예: ~/saya-deploy/saya.env
grep -nE 'reverse_proxy|@adapter_|adapters_index' <Caddyfile>
```

표로 적어 둡니다: **무엇**(kanao·kamado·telegram·slack·…), **어느 기계**, **포트**, **saya 가 닿던 주소**.
이 주소가 그대로 각자의 `SAYA_ADVERTISE_URL` 이 됩니다(saya 와 같은 기계의 `127.0.0.1` 이면 생략).

## 1. 코드 올리기

| 저장소 | 필요한 버전 | 확인 |
| --- | --- | --- |
| saya | main (#22 이후) | `test -f server/registry.ts` |
| nichirin (kanao·kamado) | kanao 0.31.0 / kamado 0.29.0 이상 | `test -f kakaocommon/register.py` |
| tsuba | main (#3 이후) | `test -f packages/serve-kit/src/register.ts` |
| chatplus-core | master (#2 이후) | `test -f chatplus_core/register.py` |

```sh
git pull --ff-only
bun install --frozen-lockfile    # saya, tsuba
bun run build                    # saya
uv sync --frozen                 # chatplus-core
```

**확인:** 위 표의 `test -f` 가 모두 성공.

## 2. 등록 토큰 만들기 (saya 서버에서)

```sh
umask 077
openssl rand -hex 32 > ~/saya-register-token     # 이 파일이 원본. 출력하지 않는다
```

**확인:** `wc -c < ~/saya-register-token` 이 `65`.

## 3. saya 서버 바꾸기

경로는 예시(`~/saya-deploy`, systemd)입니다. 0 에서 찾은 실제 경로로 바꿉니다.

```sh
ts=$(date +%Y%m%d%H%M%S)
cd ~/saya-deploy
cp -p saya.env saya.env.bak-register-$ts
cp -p Caddyfile Caddyfile.bak-register-$ts
sudo cp -p /etc/systemd/system/saya-proxy.service /etc/systemd/system/saya-proxy.service.bak-register-$ts
```

1. **env 는 한 줄만.** `printf 'SAYA_REGISTER_TOKEN=%s\n' "$(cat ~/saya-register-token)" > saya.env`
   (`SAYA_CORE_*`, `SAYA_ADAPTERS`, `SAYA_ADAPTER_*` 는 더 읽지 않습니다.)
2. **Caddyfile.** `/api` handle 과 어댑터 관련 블록(`@adapters_index`, `@adapter_<id>` 들, 또는
   `import adapters.caddy`)을 지우고 [`deploy/Caddyfile.example`](../deploy/Caddyfile.example) 의 두 블록
   (`handle @api`, `@adapters` 의 `header` 와 `handle`)으로 바꿉니다. 포트는 saya 서버 포트
   (`saya-server.service` 의 `SAYA_SERVER_PORT`, 예 `8797`). 쓰기 차단(`@blocked_write`)과
   `request_body 60MiB` 는 **그대로 둡니다.** 끝나면 Caddyfile 에 `{env.` 가 하나도 없어야 합니다.
3. **saya-proxy 유닛.** `ExecStart` 의 `--envfile …` 과 `ExecStartPre=…caddy-adapters…` 줄을 지웁니다.
4. **saya 서버 유닛.**
   ```sh
   sudo install -m 644 ~/saya/deploy/saya-server.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl disable --now saya-unfurl      # 있으면
   sudo systemctl enable --now saya-server
   sudo systemctl restart saya-proxy
   ```
5. **등록 창구는 tailnet 에만.** `sudo tailscale serve --bg --https=8798 http://127.0.0.1:8798`
   (사이트 주소 `/register` 로는 열지 않습니다.)

**확인:**

```sh
systemctl is-active saya-server saya-proxy                        # active active
grep -c '{env\.' ~/saya-deploy/Caddyfile                           # 0
curl -s http://127.0.0.1:8797/adapters                            # {"adapters":[]}  (아직 아무도 등록 전)
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://127.0.0.1:8798/register   # 401
```

이 시점부터 4 를 끝낼 때까지 목록이 비어 보이는 것이 정상입니다.

## 4. 코어와 어댑터마다 등록 설정

모두 같은 세 변수입니다. 토큰은 2 의 파일을 그 기계로 **파일째** 옮깁니다(`scp`).

| 변수 | 값 |
| --- | --- |
| `SAYA_REGISTER_URL` | saya 와 같은 기계: `http://127.0.0.1:8798` / 다른 기계: `https://<saya 기계>.<tailnet>.ts.net:8798` |
| `SAYA_REGISTER_TOKEN` | 2 의 토큰 |
| `SAYA_ADVERTISE_URL` | saya 가 이것에 닿는 주소(0 의 표). saya 와 같은 기계의 loopback 이면 생략 |

어디에 넣는지:

- **tsuba 어댑터**: 저장소의 `.env`(어댑터들이 함께 읽음)에 위 변수. `sudo systemctl restart tsuba@<id>` 를 어댑터마다.
- **kanao (Windows)**: `serve` 를 띄우는 스크립트에서 환경 변수로. PowerShell 이면
  `$env:SAYA_REGISTER_TOKEN = (Get-Content <토큰 파일> -Raw).Trim()`. 그리고 `serve` 재시작.
- **kamado (macOS)**: 띄우는 셸 스크립트에서 `export …`. 백그라운드(`&`)로 띄우면 SIGINT 가 무시된 채
  시작되므로, 끌 때 등록을 지우게 하려면 `kill -INT` 가 닿도록 띄웁니다(예: 시작할 때
  `signal.signal(SIGINT, default_int_handler)` 로 되돌리고 `runpy` 로 `kamado` 실행).
- **chatplus-core**: 실행 스크립트에서 위 변수, 그리고 재시작.

saya 와 다른 기계에 있는 것은 이미 `tailscale serve` 로 열려 있어야 합니다(예:
`tailscale serve --bg --https=8765 http://127.0.0.1:8765`). 그 주소가 `SAYA_ADVERTISE_URL` 입니다.

**확인 (각자 로그):** `registered <id> with saya as <주소>` 한 줄. 대신 아래가 보이면:

| 로그 | 뜻 | 할 일 |
| --- | --- | --- |
| `refused with 401 UNAUTHORIZED` | 토큰이 다름 | 2 의 파일을 다시 옮김 |
| `refused with 403 FORBIDDEN` | 주소가 loopback·tailnet 밖 | `SAYA_ADVERTISE_URL` 을 tailnet 주소로 |
| `unreachable (…)` | saya 등록 창구에 못 닿음 | 3-5 의 `tailscale serve`, `SAYA_REGISTER_URL` |

## 5. 끝났는지 확인

tailnet 안의 기기에서:

```sh
curl -s https://<saya 주소>/adapters                     # 0 의 어댑터 id 가 모두 (id 순)
curl -s -o /dev/null -w '%{http_code}\n' https://<saya 주소>/api/health      # 200
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<saya 주소>/adapters/x/send   # 403 (쓰기 차단 그대로)
```

그리고 브라우저로 saya 를 열어 목록에 카카오톡과 어댑터가 보이면 끝입니다. `/api/health` 가 200 인데
방 목록이 `KEY_UNAVAILABLE` 이면 등록 문제가 아니라 그 PC 의 카카오톡이 로그인·잠금 상태입니다.

옛 설정의 흔적(`SAYA_ADAPTER_*` 가 든 백업, `adapters.caddy`, `saya-unfurl.service`)은 며칠 써 보고 지웁니다.
백업에는 토큰이 들어 있습니다.

## 되돌리기

```sh
cd ~/saya-deploy
cp -p Caddyfile.bak-register-<ts> Caddyfile
cp -p saya.env.bak-register-<ts> saya.env
sudo cp -p /etc/systemd/system/saya-proxy.service.bak-register-<ts> /etc/systemd/system/saya-proxy.service
sudo systemctl disable --now saya-server && sudo systemctl enable --now saya-unfurl
sudo systemctl daemon-reload && sudo systemctl restart saya-proxy
cd ~/saya && git checkout <옮기기 전 커밋> && bun run build
```

코어·어댑터에 넣은 `SAYA_REGISTER_*` 는 그대로 둬도 됩니다. 닿을 곳이 없으면 한 줄 남기고 서빙은 계속합니다.
