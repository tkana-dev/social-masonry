import { useState, useEffect, useCallback } from 'react';
import { SocialMasonry } from 'social-masonry/react';
import type { SocialPost } from 'social-masonry';

const posts: SocialPost[] = [
  { platform: 'twitter', url: 'https://x.com/syou_koeda/status/2007800813381710176' },
  { platform: 'twitter', url: 'https://x.com/Tagotch/status/1996561616238936486' },
  { platform: 'instagram', url: 'https://www.instagram.com/p/CHyVcrApLE0/' },
  { platform: 'twitter', url: 'https://x.com/matsuken0814/status/2006171582440563024' },
  { platform: 'twitter', url: 'https://x.com/BRUTUS_mag/status/2006924668943401075' },
  { platform: 'instagram', url: 'https://www.instagram.com/p/CLM0JsvFI13/' },
  { platform: 'twitter', url: 'https://x.com/misosp/status/2007073352528298410' },
  { platform: 'twitter', url: 'https://x.com/oicyan777/status/2001780683946234300' },
  { platform: 'instagram', url: 'https://www.instagram.com/p/CnocSLlNj9V/' },
  { platform: 'twitter', url: 'https://x.com/GZQLyOMt7QfyXlE/status/2005586043958108508' },
  { platform: 'twitter', url: 'https://x.com/rena07110/status/2006322414674903214' },
  { platform: 'twitter', url: 'https://x.com/inunonekochan/status/2005095196955115827' },
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
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [manualColumns, setManualColumns] = useState<number | null>(null);
  const [currentColumns, setCurrentColumns] = useState(3);

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

  const [codeTab, setCodeTab] = useState<'react' | 'install'>('react');

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            <span className="badge-dot" />
            v1.1.0 — Animated Transitions
          </div>
          <h1>Masonry Layout for Social Embeds</h1>
          <p className="hero-description">
            Display X (Twitter) and Instagram posts using official widgets in beautiful masonry layouts.
            Auto-sizing, responsive, and easy to use.
          </p>
          <div className="hero-buttons">
            <a href="#demo" className="btn btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Live Demo
            </a>
            <a href="https://github.com/tkana-dev/social-masonry" className="btn btn-secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <h2 className="section-title">Why Social Masonry?</h2>
        <p className="section-subtitle">The simplest way to embed social media posts with proper masonry layout.</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon blue">🔗</div>
            <h3 className="feature-title">Official Widgets</h3>
            <p className="feature-description">Uses Twitter's widgets.js and Instagram's embed.js for native embeds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon pink">📐</div>
            <h3 className="feature-title">Auto-sizing</h3>
            <p className="feature-description">Each embed automatically adjusts to its content height. No fixed heights.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green">📱</div>
            <h3 className="feature-title">Fully Responsive</h3>
            <p className="feature-description">Adaptive columns that look great on any device size.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple">✨</div>
            <h3 className="feature-title">Smooth Animations</h3>
            <p className="feature-description">FLIP-based animations for seamless layout transitions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange">⚛️</div>
            <h3 className="feature-title">React Component</h3>
            <p className="feature-description">First-class React component with TypeScript support.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan">🪶</div>
            <h3 className="feature-title">Lightweight</h3>
            <p className="feature-description">Minimal bundle size. Widgets loaded on-demand.</p>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="demo" id="demo">
        <div className="demo-container">
          <h2 className="section-title">Live Demo</h2>
          <p className="section-subtitle">
            Real Twitter and Instagram embeds using official widgets.
            Try resizing the window to see smooth animations!
          </p>
          <div className="demo-controls">
            <div className="control-group">
              <span className="control-label">Columns:</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
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
                className={`control-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                Light
              </button>
              <button
                className={`control-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                Dark
              </button>
            </div>
          </div>
          <div className="masonry-wrapper">
            <SocialMasonry
              posts={posts}
              columns={currentColumns}
              gap={16}
              theme={theme}
              animate={true}
              animationDuration={300}
              animationEasing="ease-out"
              staggerDelay={20}
              style={{ maxWidth: 1400 }}
            />
          </div>
        </div>
      </section>

      {/* Code */}
      <section className="section">
        <h2 className="section-title">Quick Start</h2>
        <p className="section-subtitle">Get up and running in minutes.</p>
        <div className="code-tabs">
          <button
            className={`code-tab ${codeTab === 'react' ? 'active' : ''}`}
            onClick={() => setCodeTab('react')}
          >
            React
          </button>
          <button
            className={`code-tab ${codeTab === 'install' ? 'active' : ''}`}
            onClick={() => setCodeTab('install')}
          >
            Install
          </button>
        </div>
        <div className="code-block">
          <pre>
            {codeTab === 'react' ? (
              <code>
                <span className="code-keyword">import</span> {'{ SocialMasonry }'} <span className="code-keyword">from</span> <span className="code-string">'social-masonry/react'</span>;{'\n\n'}
                <span className="code-keyword">function</span> <span className="code-function">App</span>() {'{\n'}
                {'  '}<span className="code-keyword">const</span> posts = [{'\n'}
                {'    '}{'{ '}<span className="code-property">platform</span>: <span className="code-string">'twitter'</span>, <span className="code-property">url</span>: <span className="code-string">'https://x.com/user/status/123'</span>{' },'}{'\n'}
                {'    '}{'{ '}<span className="code-property">platform</span>: <span className="code-string">'instagram'</span>, <span className="code-property">url</span>: <span className="code-string">'https://instagram.com/p/ABC'</span>{' },'}{'\n'}
                {'  '}];{'\n\n'}
                {'  '}<span className="code-keyword">return</span> ({'\n'}
                {'    '}&lt;<span className="code-function">SocialMasonry</span>{'\n'}
                {'      '}<span className="code-property">posts</span>={'{posts}'}{'\n'}
                {'      '}<span className="code-property">columns</span>={'{['}{'\n'}
                {'        '}{'{ '}<span className="code-property">columns</span>: <span className="code-number">3</span>, <span className="code-property">minWidth</span>: <span className="code-number">1024</span>{' },'}{'\n'}
                {'        '}{'{ '}<span className="code-property">columns</span>: <span className="code-number">2</span>, <span className="code-property">minWidth</span>: <span className="code-number">640</span>{' },'}{'\n'}
                {'        '}{'{ '}<span className="code-property">columns</span>: <span className="code-number">1</span>, <span className="code-property">minWidth</span>: <span className="code-number">0</span>{' },'}{'\n'}
                {'      '}{']}'}{'\n'}
                {'      '}<span className="code-property">gap</span>={'{'}<span className="code-number">16</span>{'}'}{'\n'}
                {'      '}<span className="code-property">theme</span>=<span className="code-string">"light"</span>{'\n'}
                {'      '}<span className="code-property">animate</span>={'{'}<span className="code-keyword">true</span>{'}'}{'\n'}
                {'    '}/&gt;{'\n'}
                {'  '});{'\n'}
                {'}'}
              </code>
            ) : (
              <code>
                npm install social-masonry{'\n\n'}
                <span className="code-comment"># or</span>{'\n'}
                yarn add social-masonry{'\n\n'}
                <span className="code-comment"># or</span>{'\n'}
                pnpm add social-masonry
              </code>
            )}
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
