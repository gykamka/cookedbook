'use client'

import Link from 'next/link'
import { useLang } from '@/lib/i18n'
import { LangSwitch } from '@/components/ui'
import {
  HeroBook, RiceBowl, SoupBowl, CucumberPlate, Pudding, MilkTea,
} from '@/components/Illustrations'

export default function Home() {
  const { t } = useLang()

  return (
    <main className="min-h-screen flex flex-col px-6">
      <div className="flex justify-end pt-4">
        <LangSwitch />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
        <HeroBook size={240} />
        <h1 className="text-5xl mt-4 tracking-widest">灶记</h1>
        <p className="text-lg mt-1 text-ink-soft tracking-wider">CookedBook</p>
        <p className="text-lg mt-5">{t.tagline}</p>
        <p className="hint mt-2 leading-relaxed">{t.landingIntro}</p>

        <Link href="/login" className="btn btn-coral card-pop mt-8 px-10 text-lg">
          {t.start}
        </Link>
      </div>

      <div className="flex justify-center gap-3 pb-8 pt-6">
        <CucumberPlate size={44} />
        <SoupBowl size={44} />
        <RiceBowl size={44} />
        <Pudding size={44} />
        <MilkTea size={44} />
      </div>
    </main>
  )
}
