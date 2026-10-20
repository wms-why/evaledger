import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { localeHead } from '@/features/seo/seo'
import { getOrigin } from '@/features/seo/seo.fns'
import { getOptionalUser } from '@/features/auth/middleware'
import { useTranslation } from '@/features/i18n/provider'
import { legalDocs } from '@/features/i18n/dictionaries/legal'
import { LegalPage } from '@/components/marketing/legal-page'
import type { Locale } from '@/features/i18n/locale'

const rootRoute = getRouteApi('__root__')

export const Route = createFileRoute('/{-$locale}/privacy')({
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
      path: '/privacy',
      title: `${legalDocs[locale].privacy.title} — EvalLedger`,
      description:
        locale === 'zh'
          ? 'EvalLedger 隐私政策：我们收集哪些数据、如何使用、与哪些服务商共享，以及你的访问、导出与删除权利。'
          : 'EvalLedger Privacy Policy: what we collect, how we use it, who processes it, and your rights to access, export and delete your data.',
    })
    return { meta, links }
  },
  component: Privacy,
})

function Privacy() {
  const { loggedIn } = Route.useLoaderData()
  const { theme } = rootRoute.useLoaderData()
  const { locale } = useTranslation()
  return <LegalPage theme={theme} loggedIn={loggedIn} doc={legalDocs[locale].privacy} />
}
