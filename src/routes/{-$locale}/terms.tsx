import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { useTranslation } from '@/features/i18n/provider'
import { legalDocs } from '@/features/i18n/dictionaries/legal'
import { LegalPage } from '@/components/marketing/legal-page'
import type { Locale } from '@/features/i18n/locale'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/terms')({
  loader: async () => {
    const [origin, user] = await Promise.all([getOrigin(), getOptionalUser()])
    return { origin, loggedIn: !!user }
  },
  head: ({ loaderData, params }) => {
    const origin = loaderData?.origin ?? ''
    const locale = ((params as { locale?: string }).locale ?? 'en') as Locale
    const { meta, links } = localeHead({
      origin,
      locale,
      path: '/terms',
      title: `${legalDocs[locale].terms.title} — EvalLedger`,
      description:
        locale === 'zh'
          ? 'EvalLedger 服务条款：账号、套餐与计费、内容归属、AI 功能、可接受使用与责任限制。'
          : 'EvalLedger Terms of Service: accounts, plans and billing, content ownership, AI features, acceptable use and liability.',
    })
    return { meta, links }
  },
  component: Terms,
})

function Terms() {
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  const { locale } = useTranslation()
  return <LegalPage theme={theme} loggedIn={loggedIn} doc={legalDocs[locale].terms} />
}
