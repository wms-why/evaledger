import { createFileRoute, Link } from '@tanstack/react-router'
import { getEnabledSocialProviders } from '@/features/auth/middleware'
import { safeNextPath } from '@/features/auth/redirect'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { authPageHead } from '@/features/auth/head'
import { AuthCard } from '@/features/auth/components/auth-card'
import { SocialButtons } from '@/features/auth/components/social-buttons'

export const Route = createFileRoute('/{-$locale}/(auth)/register')({
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: safeNextPath(search.next),
  }),
  head: ({ params }) => authPageHead(params, 'registerTitle'),
  loader: async () => {
    const providers = await getEnabledSocialProviders()
    // Register is Google-only — strip any other provider so the page can never
    // accidentally expose them if more social logins get configured later.
    return { providers: providers.filter((p) => p === 'google') }
  },
  component: Register,
})

function Register() {
  const { providers } = Route.useLoaderData()
  const { next } = Route.useSearch()
  const { t, locale } = useTranslation()
  const callbackURL = next ?? localizePath(locale, '/app')
  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
      <SocialButtons providers={providers} callbackURL={callbackURL} />
      <p className="mt-5 text-center text-sm text-fg-2">
        {t('auth.haveAccount')}{' '}
        <Link to="/{-$locale}/login" search={{ next }} className="font-semibold text-primary">
          {t('auth.login')}
        </Link>
      </p>
    </AuthCard>
  )
}
