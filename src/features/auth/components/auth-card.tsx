import { useState, type ReactNode, type ComponentType } from 'react'
import { Link, getRouteApi } from '@tanstack/react-router'
import { ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { LangSwitch } from '@/features/i18n/lang-switch'
import { useTranslation } from '@/features/i18n/provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const rootRoute = getRouteApi('__root__')

/** Apple-minimalist auth shell: logo-is-home header (a back-chevron slides
 *  in on hover/focus), centered card on a soft alt background. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
}) {
  const { theme } = rootRoute.useLoaderData()
  return (
    <div className="auth-wrap">
      <div className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
        <Link to="/{-$locale}" className="auth-home" aria-label="EvalLedger">
          <span className="auth-back" aria-hidden="true">
            <ChevronLeft size={16} />
          </span>
          {/* asLink={false}: the Logo is a link on its own — nesting an <a>
              inside an <a> is invalid HTML, and React cannot hydrate it (the
              parser closes the outer anchor first, so the tree never
              matches the server's). */}
          <Logo asLink={false} />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle theme={theme} />
          <LangSwitch />
        </div>
      </div>
      <div className="auth-body">
        <div className="auth-card">
          <h1 className="m-0 mb-1.5 text-[28px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="m-0 mb-6 text-[14.5px] text-fg-2">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

/** Labeled input with optional lead icon, password visibility toggle, and hint. */
export function Field({
  id,
  label,
  type = 'text',
  value,
  onChange,
  icon: Icon,
  required,
  minLength,
  placeholder,
  autoComplete,
  hint,
  hintErr,
  canToggle,
}: {
  id: string
  label: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  icon?: ComponentType<{ size?: number }>
  required?: boolean
  minLength?: number
  placeholder?: string
  autoComplete?: string
  hint?: string
  hintErr?: boolean
  canToggle?: boolean
}) {
  const { t } = useTranslation()
  const [show, setShow] = useState(false)
  const inputType = canToggle ? (show ? 'text' : 'password') : type
  return (
    <div className="field">
      <Label htmlFor={id}>
        {label}
        {required && <span className="req"> *</span>}
      </Label>
      <div className="field-wrap">
        {Icon && (
          <span className="lead">
            <Icon size={17} />
          </span>
        )}
        <Input
          id={id}
          className={Icon ? 'pl-[38px]' : undefined}
          type={inputType}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        {canToggle && (
          <button
            type="button"
            className="trail"
            onClick={() => setShow((s) => !s)}
            aria-label={t('auth.showPassword')}
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {hint && <span className={hintErr ? 'field-hint err' : 'field-hint'}>{hint}</span>}
    </div>
  )
}