import { createFileRoute, Link } from '@tanstack/react-router'
import { getEnabledSocialProviders } from '@/features/auth/middleware'
import { useTranslation } from '@/features/i18n/provider'
import { authPageHead } from '@/features/auth/head'
import { AuthCard } from '@/features/auth/components/auth-card'
import { SocialButtons } from '@/features/auth/components/social-buttons'

export const Route = createFileRoute('/{-$locale}/(auth)/register')({
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
  const { t } = useTranslation()
  return (
    <AuthCard title={t('auth.registerTitle')} subtitle={t('auth.registerSub')}>
      <SocialButtons providers={providers} />
      <p className="mt-5 text-center text-sm text-fg-2">
        {t('auth.haveAccount')}{' '}
        <Link to="/{-$locale}/login" className="font-semibold text-primary">
          {t('auth.login')}
        </Link>
      </p>
    </AuthCard>
  )
}