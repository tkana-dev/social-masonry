import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { SocialMasonry } from 'social-masonry/react';
import { detectPlatform, generatePostId } from 'social-masonry';

const DEFAULT_URLS: string[] = [
  'https://x.com/syou_koeda/status/2007800813381710176',
  'https://x.com/Tagotch/status/1996561616238936486',
  'https://www.instagram.com/p/CHyVcrApLE0/',
  'https://x.com/matsuken0814/status/2006171582440563024',
  'https://x.com/BRUTUS_mag/status/2006924668943401075',
  'https://www.instagram.com/p/CLM0JsvFI13/',
  'https://x.com/misosp/status/2007073352528298410',
  'https://x.com/oicyan777/status/2001780683946234300',
  'https://www.instagram.com/p/CnocSLlNj9V/',
  'https://x.com/GZQLyOMt7QfyXlE/status/2005586043958108508',
  'https://x.com/rena07110/status/2006322414674903214',
  'https://x.com/inunonekochan/status/2005095196955115827',
];

const columnConfig = [
  { columns: 4, minWidth: 1280 },
  { columns: 3, minWidth: 900 },
  { columns: 2, minWidth: 640 },
  { columns: 1, minWidth: 0 },
];

function getResponsiveColumns(width: number): number {
  for (const config of columnConfig) {
    if (width >= config.minWidth) {
      return config.columns;
    }
  }
  return 1;
}

function App() {
  const [urls, setUrls] = useState<string[]>(DEFAULT_URLS);
  const [urlInput, setUrlInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [manualColumns, setManualColumns] = useState<number | null>(null);
  const [currentColumns, setCurrentColumns] = useState(3);
  const [lazyLoad, setLazyLoad] = useState(true);
  const [codeTab, setCodeTab] = useState<'react' | 'install'>('react');
  const [installCopied, setInstallCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const isCustomized = urls !== DEFAULT_URLS;

  const updateResponsiveColumns = useCallback(() => {
    if (manualColumns === null) {
      const cols = getResponsiveColumns(window.innerWidth);
      setCurrentColumns(cols);
    }
  }, [manualColumns]);

  useEffect(() => {
    updateResponsiveColumns();
    window.addEventListener('resize', updateResponsiveColumns);
    return () => window.removeEventListener('resize', updateResponsiveColumns);
  }, [updateResponsiveColumns]);

  const handleColumnChange = (cols: number) => {
    setManualColumns(cols);
    setCurrentColumns(cols);
  };

  const handleAddUrl = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    const platform = detectPlatform(trimmed);
    if (!platform) {
      setFeedback({
        type: 'error',
        text: 'Please paste a valid X (Twitter) status URL or Instagram post/reel URL.',
      });
      return;
    }

    const newId = generatePostId({ platform, url: trimmed });
    const alreadyExists = urls.some((existing) => {
      const existingPlatform = detectPlatform(existing);
      if (!existingPlatform) return false;
      return generatePostId({ platform: existingPlatform, url: existing }) === newId;
    });

    if (alreadyExists) {
      setFeedback({
        type: 'error',
        text: 'That post is already in the grid.',
      });
      return;
    }

    setUrls((prev) => [trimmed, ...prev]);
    setUrlInput('');
    setFeedback({
      type: 'success',
      text: `Added ${platform === 'twitter' ? 'X (Twitter)' : 'Instagram'} post to the wall!`,
    });
  };

  const handleResetPosts = () => {
    setUrls(DEFAULT_URLS);
    setFeedback(null);
  };

  const generatedReactCode = useMemo(() => {
    const sampleUrls = urls.slice(0, 3);
    const urlsFormatted = sampleUrls.map((u) => `  '${u}',`).join('\n');
    return `import { SocialMasonry } from 'social-masonry/react';

const posts = [
${urlsFormatted}
];

export function SocialWall() {
  return (
    <SocialMasonry
      posts={posts}
      columns={[
        { columns: 4, minWidth: 1280 },
        { columns: 3, minWidth: 900 },
        { columns: 2, minWidth: 640 },
        { columns: 1, minWidth: 0 },
      ]}
      gap={16}
      theme="${theme}"
      lazyLoad={${lazyLoad}}
    />
  );
}`;
  }, [urls, theme, lazyLoad]);

  const installCode = `npm install social-masonry

# or
pnpm add social-masonry

# or
yarn add social-masonry`;

  const copyText = async (text: string, onSuccess: () => void) => {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess();
    } catch {
      // Clipboard API unavailable in non-secure contexts
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            <span className="badge-dot" />
            v1.3.2 — Zero-Jank Loading &amp; URL-Only API
          </div>
          <h1>Drop-in Social Wall for React &amp; Next.js</h1>
          <p className="hero-description">
            Display X (Twitter) and Instagram embeds in a responsive masonry layout without layout jumping.
            Just pass URLs — no API keys required.
          </p>
          <button
            type="button"
            className="install-pill"
            onClick={() =>
              copyText('npm install social-masonry', () => {
                setInstallCopied(true);
                setTimeout(() => setInstallCopied(false), 1800);
              })
            }
            aria-label="Copy npm install command"
          >
            <span className="install-pill-prefix">$</span>
            <span>npm install social-masonry</span>
            <span className={`install-pill-copy ${installCopied ? 'copied' : ''}`}>
              {installCopied ? 'Copied!' : 'Copy'}
            </span>
          </button>
          <div className="hero-buttons">
            <a href="#demo" className="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Try Playground
            </a>
            <a href="https://github.com/tkana-dev/social-masonry" className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2 className="section-title">Why Social Masonry?</h2>
        <p className="section-subtitle">
          Embedding X and Instagram posts in a masonry grid usually causes chaotic jumping as iframes load.
          Social Masonry fixes that out of the box.
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">📌</div>
            <h3 className="feature-title">Zero Horizontal Jumping</h3>
            <p className="feature-description">
              Stable column pinning keeps every card in its column while embeds load asynchronously, with shimmer skeletons until ready.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon pink">🔗</div>
            <h3 className="feature-title">Just Pass URLs</h3>
            <p className="feature-description">
              Pass an array of X and Instagram URLs directly — platforms are auto-detected and official scripts load on-demand once.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">▲</div>
            <h3 className="feature-title">Next.js App Router Ready</h3>
            <p className="feature-description">
              Ships with built-in <code>&apos;use client&apos;</code> directive and SSR-safe hooks so it works seamlessly in React &amp; Next.js.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple">✨</div>
            <h3 className="feature-title">Smooth GPU Transitions</h3>
            <p className="feature-description">
              Interruptible <code>translate3d</code> transitions on resize and column changes, automatically respecting <code>prefers-reduced-motion</code>.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange">🛡️</div>
            <h3 className="feature-title">Graceful Error Fallbacks</h3>
            <p className="feature-description">
              Deleted posts or ad-blocked embeds degrade cleanly into a clickable fallback card instead of leaving empty gaps.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan">⏳</div>
            <h3 className="feature-title">Lazy Loading Built-in</h3>
            <p className="feature-description">
              Defer off-screen embeds via Intersection Observer to keep landing pages and testimonial walls fast.
            </p>
          </div>
        </div>
      </section>

      {/* Live Playground */}
      <section className="demo" id="demo">
        <div className="demo-container">
          <h2 className="section-title">Interactive Playground</h2>
          <p className="section-subtitle">
            Paste any X (Twitter) or Instagram URL below to test it live, or toggle columns and theme.
          </p>

          <div className="playground-bar">
            <form className="playground-form" onSubmit={handleAddUrl}>
              <input
                type="url"
                className="playground-input"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (feedback) setFeedback(null);
                }}
                placeholder="Paste an X (x.com/.../status/...) or Instagram (instagram.com/p/...) URL"
                aria-label="Social post URL"
              />
              <button type="submit" className="playground-submit">
                + Add Post
              </button>
              {isCustomized && (
                <button type="button" className="playground-reset" onClick={handleResetPosts}>
                  Reset
                </button>
              )}
            </form>
            <div className={`playground-feedback ${feedback?.type ?? ''}`} role="status">
              {feedback?.text ?? ''}
            </div>
          </div>

          <div className="demo-controls">
            <div className="control-group">
              <span className="control-label">Columns:</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`control-btn ${currentColumns === n ? 'active' : ''}`}
                  onClick={() => handleColumnChange(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="control-group">
              <span className="control-label">Theme:</span>
              <button
                type="button"
                className={`control-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
              <button
                type="button"
                className={`control-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
            </div>
            <div className="control-group">
              <span className="control-label">Lazy Load:</span>
              <button
                type="button"
                className={`control-btn ${lazyLoad ? 'active' : ''}`}
                onClick={() => setLazyLoad(true)}
              >
                On
              </button>
              <button
                type="button"
                className={`control-btn ${!lazyLoad ? 'active' : ''}`}
                onClick={() => setLazyLoad(false)}
              >
                Off
              </button>
            </div>
          </div>

          <div className="masonry-wrapper">
            <SocialMasonry
              posts={urls}
              columns={currentColumns}
              gap={16}
              theme={theme}
              animate={true}
              animationDuration={300}
              animationEasing="ease-out"
              staggerDelay={20}
              lazyLoad={lazyLoad}
              style={{ maxWidth: 1400 }}
            />
          </div>
        </div>
      </section>

      {/* Code */}
      <section className="section">
        <h2 className="section-title">Quick Start</h2>
        <p className="section-subtitle">
          Copy the generated snippet matching your current playground settings.
        </p>
        <div className="code-header">
          <div className="code-tabs">
            <button
              type="button"
              className={`code-tab ${codeTab === 'react' ? 'active' : ''}`}
              onClick={() => setCodeTab('react')}
            >
              React / Next.js
            </button>
            <button
              type="button"
              className={`code-tab ${codeTab === 'install' ? 'active' : ''}`}
              onClick={() => setCodeTab('install')}
            >
              Install
            </button>
          </div>
          <button
            type="button"
            className={`code-copy-btn ${codeCopied ? 'copied' : ''}`}
            onClick={() =>
              copyText(codeTab === 'react' ? generatedReactCode : installCode, () => {
                setCodeCopied(true);
                setTimeout(() => setCodeCopied(false), 1800);
              })
            }
          >
            {codeCopied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <div className="code-block">
          <pre>
            <code>{codeTab === 'react' ? generatedReactCode : installCode}</code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-links">
          <a href="https://github.com/tkana-dev/social-masonry#readme">Documentation</a>
          <a href="https://github.com/tkana-dev/social-masonry">GitHub</a>
          <a href="https://www.npmjs.com/package/social-masonry">npm</a>
        </div>
        <p className="footer-copy">MIT License</p>
      </footer>
    </>
  );
}

export default App;
