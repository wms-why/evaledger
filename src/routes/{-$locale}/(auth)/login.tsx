import { createFileRoute, Link } from '@tanstack/react-router'
import { getEnabledSocialProviders } from '@/features/auth/middleware'
import { safeNextPath } from '@/features/auth/redirect'
import { useTranslation } from '@/features/i18n/provider'
import { localizePath } from '@/features/i18n/locale'
import { authPageHead } from '@/features/auth/head'
import { AuthCard } from '@/features/auth/components/auth-card'
import { SocialButtons } from '@/features/auth/components/social-buttons'

export const Route = createFileRoute('/{-$locale}/(auth)/login')({
  // `next` is where the visitor came from (e.g. the report form on
  // /data-quality). It is validated here, before it is ever handed to the
  // OAuth callback. Returning the key even when invalid is deliberate: the
  // router merges parent search params, so an omitted key would let `//evil`
  // survive under the same name.
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next: safeNextPath(search.next),
  }),
  head: ({ params }) => authPageHead(params, 'loginTitle'),
  loader: async () => {
    const providers = await getEnabledSocialProviders()
    // Login is Google-only — strip any other provider so the page can never
    // accidentally expose them if more social logins get configured later.
    return { providers: providers.filter((p) => p === 'google') }
  },
  component: Login,
})

function Login() {
  const { providers } = Route.useLoaderData()
  const { next } = Route.useSearch()
  const { t, locale } = useTranslation()
  const callbackURL = next ?? localizePath(locale, '/app')
  return (
    <AuthCard title={t('auth.loginTitle')} subtitle={t('auth.loginSub')}>
      <SocialButtons providers={providers} callbackURL={callbackURL} />
      <p className="mt-5 text-center text-sm text-fg-2">
        {t('auth.noAccount')}{' '}
        <Link to="/{-$locale}/register" search={{ next }} className="font-semibold text-primary">
          {t('auth.register')}
        </Link>
      </p>
    </AuthCard>
  )
}
