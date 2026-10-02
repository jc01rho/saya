import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import reads from "../reads/reads.module.css";
import { imageVars } from "./apply";
import { THEME_COPY } from "./copy";
import {
  fetchGallery,
  fetchGalleryTheme,
  type GalleryCharacter,
  type GalleryTheme,
} from "./gallery";
import { buildThemePrompt } from "./prompt";
import {
  type ParseResult,
  parseTheme,
  type ThemeDefinition,
  themeVars,
} from "./schema";
import {
  customChoice,
  deleteCustomTheme,
  loadChoice,
  loadCustomThemes,
  type StoredTheme,
  saveChoice,
  saveCustomTheme,
  type ThemeChoice,
} from "./store";
import { themeStorage } from "./ThemeControl";
import styles from "./ThemeSheet.module.css";

/** A small screen drawn in the candidate's colours, with made-up words only. */
function ThemePreview({ theme }: { theme: ThemeDefinition }) {
  return (
    <figure
      className={styles.preview}
      style={
        { ...themeVars(theme), ...imageVars(theme.images) } as CSSProperties
      }
      data-ui="theme-preview"
      data-mode={theme.mode}
    >
      <figcaption className="sr-only">{THEME_COPY.preview}</figcaption>
      <div className={styles.previewHead} aria-hidden="true">
        <strong>{THEME_COPY.previewRoom}</strong>
        <span>{THEME_COPY.previewMembers}</span>
        {theme.images?.mascot ? (
          <span
            className={styles.previewMascot}
            data-ui="theme-preview-mascot"
          />
        ) : null}
      </div>
      <div className={styles.previewWall} aria-hidden="true">
        <p className={styles.previewLine}>
          <span className={styles.previewOther}>{THEME_COPY.previewOther}</span>
          <span className={styles.previewMeta}>{THEME_COPY.previewTime}</span>
        </p>
        <p className={`${styles.previewLine} ${styles.previewMine}`}>
          <span className={styles.previewMeta}>
            {THEME_COPY.previewRead} · {THEME_COPY.previewTime}
          </span>
          <span className={styles.previewSelf}>
            {THEME_COPY.previewSelf}{" "}
            <span className={styles.previewLink}>{THEME_COPY.previewLink}</span>
          </span>
        </p>
      </div>
      <div className={styles.previewFoot} aria-hidden="true">
        <span className={styles.previewInput}>{THEME_COPY.previewInput}</span>
        <span className={styles.previewSend}>{THEME_COPY.previewSend}</span>
      </div>
    </figure>
  );
}

const CHIP_SLOTS = ["wall", "bubbleSelf", "accent", "text"] as const;

/** Ready-made themes from the remote catalog: the list is fetched when the sheet opens, a theme file when its card is pressed. */
function ThemeGallery({
  onSave,
  onStatus,
}: {
  onSave: (theme: ThemeDefinition) => boolean;
  onStatus: (status: string) => void;
}) {
  const [list, setList] = useState<GalleryCharacter[] | "loading" | "failed">(
    "loading",
  );
  const mounted = useRef(true);
  const loadList = useCallback(() => {
    setList("loading");
    void fetchGallery().then((characters) => {
      if (mounted.current) setList(characters ?? "failed");
    });
  }, []);
  useEffect(() => {
    mounted.current = true;
    loadList();
    return () => {
      mounted.current = false;
    };
  }, [loadList]);
  const [loading, setLoading] = useState<string | null>(null);
  const pick = async (entry: GalleryTheme) => {
    setLoading(entry.url);
    onStatus(THEME_COPY.galleryLoading(entry.name));
    const theme = await fetchGalleryTheme(entry);
    setLoading(null);
    if (theme) onSave(theme);
    else onStatus(THEME_COPY.galleryFailed(entry.name));
  };
  return (
    <section className={styles.gallery} data-ui="theme-gallery">
      <h3 className={styles.subhead}>{THEME_COPY.gallery}</h3>
      {Array.isArray(list) ? (
        <p className={reads.muted}>{THEME_COPY.galleryHelp}</p>
      ) : null}
      {list === "loading" ? (
        <p className={reads.muted} data-ui="theme-gallery-state">
          {THEME_COPY.galleryListLoading}
        </p>
      ) : null}
      {list === "failed" ? (
        <p className={reads.muted} data-ui="theme-gallery-state">
          {THEME_COPY.galleryListFailed}{" "}
          <button
            type="button"
            className={reads.action}
            onClick={loadList}
            data-ui="theme-gallery-retry"
          >
            {THEME_COPY.galleryRetry}
          </button>
        </p>
      ) : null}
      <ul className={styles.cards}>
        {(Array.isArray(list) ? list : []).flatMap((character) =>
          character.themes.map((entry) => (
            <li key={entry.url}>
              <button
                type="button"
                className={styles.card}
                aria-label={THEME_COPY.galleryApply(entry.name)}
                aria-busy={loading === entry.url}
                disabled={loading !== null}
                onClick={() => void pick(entry)}
                data-ui="theme-gallery-card"
                data-id={`${character.id}-${entry.mode}`}
              >
                <span className={styles.chips} aria-hidden="true">
                  {CHIP_SLOTS.map((slot, index) => (
                    <span
                      key={slot}
                      className={styles.chip}
                      style={{ background: entry.colors[index] }}
                    />
                  ))}
                </span>
                <span className={styles.cardName}>{entry.name}</span>
                <span className={styles.cardFan}>
                  {THEME_COPY.galleryMode[entry.mode]} · {THEME_COPY.galleryFan}
                </span>
              </button>
            </li>
          )),
        )}
      </ul>
    </section>
  );
}

function ThemeMaker({
  onSave,
}: {
  /** True once the theme is kept; a refused save leaves the paste in place. */
  onSave: (theme: ThemeDefinition) => boolean;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [text, setText] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const pasteId = useId();
  const promptId = useId();
  const copy = () => {
    const prompt = buildThemePrompt();
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (!clipboard) {
      setCopyState("failed");
      return;
    }
    clipboard.writeText(prompt).then(
      () => setCopyState("copied"),
      () => setCopyState("failed"),
    );
  };
  return (
    <section className={styles.maker} data-ui="theme-maker">
      <h3 className={styles.subhead}>{THEME_COPY.make}</h3>
      <p className={reads.muted}>{THEME_COPY.makeHelp}</p>
      <div className={styles.row}>
        <button
          type="button"
          className={reads.action}
          onClick={copy}
          data-ui="theme-copy-prompt"
        >
          {THEME_COPY.copy}
        </button>
        <span role="status" className={reads.muted}>
          {copyState === "copied" ? THEME_COPY.copied : null}
          {copyState === "failed" ? THEME_COPY.copyFailed : null}
        </span>
      </div>
      {copyState === "failed" ? (
        <>
          <label className={styles.label} htmlFor={promptId}>
            {THEME_COPY.promptLabel}
          </label>
          <textarea
            id={promptId}
            className={styles.field}
            readOnly
            rows={6}
            value={buildThemePrompt()}
            onFocus={(event) => event.currentTarget.select()}
          />
        </>
      ) : null}
      <label className={styles.label} htmlFor={pasteId}>
        {THEME_COPY.paste}
      </label>
      <textarea
        id={pasteId}
        className={styles.field}
        rows={6}
        spellCheck={false}
        value={text}
        data-ui="theme-paste"
        onChange={(event) => {
          setText(event.currentTarget.value);
          setResult(null);
        }}
      />
      <div className={styles.row}>
        <button
          type="button"
          className={reads.action}
          disabled={!text.trim()}
          onClick={() => setResult(parseTheme(text))}
          data-ui="theme-check"
        >
          {THEME_COPY.check}
        </button>
      </div>
      {result && !result.ok ? (
        <div role="alert" className={styles.issues} data-ui="theme-issues">
          <p className={styles.issueTitle}>{THEME_COPY.issues}</p>
          <ul>
            {result.issues.map((issue) => {
              const line = THEME_COPY.issue(issue);
              return <li key={line}>{line}</li>;
            })}
          </ul>
        </div>
      ) : null}
      {result?.ok ? (
        <div className={styles.candidate} data-ui="theme-candidate">
          {result.warnings.length > 0 ? (
            <div className={styles.issues} data-ui="theme-warnings">
              <p className={styles.issueTitle}>{THEME_COPY.warnings}</p>
              {result.warnings.some((warning) => warning.image) ? (
                <p>{THEME_COPY.imageWarnings}</p>
              ) : null}
              <ul>
                {result.warnings.map((warning) => (
                  <li key={`${warning.text}/${warning.background}`}>
                    {THEME_COPY.warning(warning)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.ignored.length > 0 ? (
            <p className={reads.muted}>{THEME_COPY.ignored(result.ignored)}</p>
          ) : null}
          <ThemePreview theme={result.theme} />
          <div className={styles.row}>
            <button
              type="button"
              className={reads.action}
              onClick={() => {
                if (!onSave(result.theme)) return;
                setText("");
                setResult(null);
              }}
              data-ui="theme-save"
            >
              {THEME_COPY.save}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * The theme button in the list head and the sheet it opens: the built-in
 * themes, saved themes, and the maker. The choice lives in localStorage and
 * `public/theme-boot.js` draws it again before the next first paint.
 */

/** The sheet itself: built-in and saved themes, then the maker. */
export default function ThemeSheet({
  onChange,
  onClose,
}: {
  /** Called with what was stored, so the button's owner draws it. */
  onChange: (stored: StoredTheme) => void;
  onClose: () => void;
}) {
  const [customs, setCustoms] = useState(() =>
    loadCustomThemes(themeStorage()),
  );
  const [choice, setChoice] = useState<ThemeChoice>(() =>
    loadChoice(themeStorage(), customs),
  );
  const [status, setStatus] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const group = useId();
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);
  const choose = (
    next: ThemeChoice,
    themes: readonly ThemeDefinition[] = customs,
  ) => {
    const stored = saveChoice(themeStorage(), next, themes);
    setChoice(stored.choice);
    onChange(stored);
  };
  const save = (theme: ThemeDefinition) => {
    const saved = saveCustomTheme(themeStorage(), customs, theme);
    if (!saved.ok) {
      setStatus(
        saved.reason === "limit" ? THEME_COPY.limit : THEME_COPY.storage,
      );
      return false;
    }
    setCustoms(saved.customs);
    choose(customChoice(theme), saved.customs);
    setStatus(THEME_COPY.saved(theme.name));
    return true;
  };
  const remove = (name: string) => {
    const next = deleteCustomTheme(themeStorage(), customs, name);
    setCustoms(next);
    if (choice === `custom:${name}`) choose("system", next);
  };
  const options: { value: ThemeChoice; label: string }[] = [
    { value: "system", label: THEME_COPY.system },
    { value: "light", label: THEME_COPY.builtin.light },
    { value: "dark", label: THEME_COPY.builtin.dark },
    { value: "kakao", label: THEME_COPY.builtin.kakao },
    ...customs.map((theme) => ({
      value: customChoice(theme),
      label: theme.name,
    })),
  ];
  return (
    <dialog
      ref={dialog}
      className={`${reads.sheet} ${styles.sheet}`}
      aria-labelledby={headingId}
      data-ui="theme-dialog"
      onClose={onClose}
    >
      <header className={reads.head}>
        <div className={reads.heading}>
          <h2 id={headingId} className={reads.title}>
            {THEME_COPY.title}
          </h2>
        </div>
        <button
          type="button"
          className={`${reads.action} ${reads.close}`}
          onClick={() => dialog.current?.close()}
        >
          {THEME_COPY.close}
        </button>
      </header>
      <div className={reads.body}>
        <fieldset className={styles.choices}>
          <legend className="sr-only">{THEME_COPY.choices}</legend>
          {options.map(({ value, label }) => (
            <div key={value} className={styles.choice}>
              <label className={styles.option}>
                <input
                  type="radio"
                  name={group}
                  value={value}
                  checked={choice === value}
                  onChange={() => choose(value)}
                />
                <span>{label}</span>
              </label>
              {value.startsWith("custom:") ? (
                <button
                  type="button"
                  className={reads.action}
                  aria-label={THEME_COPY.remove(label)}
                  onClick={() => remove(label)}
                  data-ui="theme-remove"
                >
                  {THEME_COPY.removeShort}
                </button>
              ) : null}
            </div>
          ))}
        </fieldset>
        <p role="status" className={reads.muted} data-ui="theme-status">
          {status}
        </p>
        <ThemeGallery onSave={save} onStatus={setStatus} />
        <ThemeMaker onSave={save} />
      </div>
    </dialog>
  );
}
