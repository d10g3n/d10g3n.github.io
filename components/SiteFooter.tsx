'use client';

import { useLanguage } from './LanguageProvider';

export function SiteFooter({ padded = false }: { padded?: boolean }) {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container" style={padded ? { paddingBottom: 200 } : undefined}>
        <p>© D10G3N Live - {t('footer.rights')}.</p>
        <p className="footer-contracts">
          <a href="/privacy-policy.html">{t('footer.privacy')}</a>
          <span>|</span>
          <a href="/copyright.html">{t('footer.copyright')}</a>
          <span>|</span>
          <a href="mailto:contact@d10g3n.live">contact@d10g3n.live</a>
          <span>|</span>
          <span className="version">{`v${process.env.NEXT_PUBLIC_APP_VERSION ?? '2.0.0+dev'}`}</span>
        </p>
      </div>
    </footer>
  );
}
