import { Suspense } from 'react'
import ExtractRecipeClient from './ExtractRecipeClient'
import { Loading } from '@/components/ui'

export default function ExtractRecipePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExtractRecipeClient />
    </Suspense>
  )
}
