'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { languages } from '../lib/i18n';
import { useLanguage } from './LanguageProvider';

const links = [
  ['home', 'nav.home'],
  ['albums', 'nav.albums'],
  ['tracks', 'nav.tracks'],
  ['about', 'nav.about'],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (pathname !== '/') return;
    const updateActiveSection = () => {
      let current = 'home';
      for (const [id] of links) {
        const section = document.getElementById(id);
        if (section && window.scrollY >= section.offsetTop - 120) current = id;
      }
      setActiveSection(current);
    };
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveSection);
  }, [pathname]);

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <Link href="/" aria-label="D10G3N Live home"><h1>D10G3N Live</h1></Link>
          </div>
          <nav className="nav" aria-label="Primary navigation">
            <button
              className="nav-toggle"
              type="button"
              aria-label={t('aria.toggleNav')}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              <span /><span /><span />
            </button>
            <ul className={`nav-menu${open ? ' active' : ''}`}>
              {links.map(([id, label]) => (
                <li key={id}>
                  <Link
                    href={`/#${id}`}
                    className={`nav-link${pathname === '/' && id === activeSection ? ' active' : ''}`}
                    onClick={() => { setActiveSection(id); setOpen(false); }}
                  >
                    {t(label)}
                  </Link>
                </li>
              ))}
              <li className="lang-selector-item">
                <select
                  className="lang-select"
                  aria-label={t('lang.select')}
                  value={language}
                  onChange={(event) => setLanguage(event.target.value as typeof language)}
                >
                  {languages.map((lang) => <option value={lang} key={lang}>{lang.toUpperCase()}</option>)}
                </select>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
