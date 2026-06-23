'use client'

import type { ReactNode } from 'react'
import { ModalProvider } from './modal-context'
import { VideoBackground } from './video-background'
import { Spotlight } from './spotlight'
import { SiteHeader } from './site-header'
import { SiteFooter } from './site-footer'
import { SiteModals } from './site-modals'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ModalProvider>
      <VideoBackground />
      <Spotlight />
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
      <SiteModals />
    </ModalProvider>
  )
}
