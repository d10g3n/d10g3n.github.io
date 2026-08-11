'use client';

import { GlobalPlayer } from './GlobalPlayer';
import { LanguageProvider } from './LanguageProvider';
import { LegacyHashBridge } from './LegacyHashBridge';
import { PlayerProvider } from './PlayerProvider';
import { PwaRegister } from './PwaRegister';
import { SiteHeader } from './SiteHeader';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <PlayerProvider>
        <SiteHeader />
        {children}
        <GlobalPlayer />
        <LegacyHashBridge />
        <PwaRegister />
      </PlayerProvider>
    </LanguageProvider>
  );
}
