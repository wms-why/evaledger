import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { WaitlistForm } from './waitlist-form'
import { useTranslation } from '@/features/i18n/provider'
import type { WaitlistSource } from '@/features/waitlist/source'

export function WaitlistDialog({
  open,
  onOpenChange,
  turnstileSiteKey,
  source = 'waitlist',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  turnstileSiteKey: string | null
  source?: WaitlistSource
}) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('waitlist.comingSoonTitle')}</DialogTitle>
          <DialogDescription>{t('waitlist.comingSoonBody')}</DialogDescription>
        </DialogHeader>
        <WaitlistForm turnstileSiteKey={turnstileSiteKey} source={source} />
      </DialogContent>
    </Dialog>
  )
}
