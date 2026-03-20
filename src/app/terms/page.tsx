'use client';

import Link from 'next/link';
import { PublicPageShell } from '@/components/PublicPageShell';
import { useLocale } from '@/contexts/LocaleContext';
import { Loader } from '@/components/ui/Loader';

export default function TermsPage() {
  const { t, isInitialized } = useLocale();

  if (!isInitialized) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  return (
    <PublicPageShell title={t('legal.termsTitle')}>
      <p className="text-sm text-neutral-600 mb-6">{t('legal.lastUpdated')}</p>
      <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-4">
        <p>{t('legal.termsIntro')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionAcceptance')}</h2>
        <p>{t('legal.termsAcceptance')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionServiceDescription')}</h2>
        <p>{t('legal.termsServiceDescription')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionAccounts')}</h2>
        <p>{t('legal.termsAccounts')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionUserConduct')}</h2>
        <p>{t('legal.termsUserConduct')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionPrivacyRef')}</h2>
        <p>{t('legal.termsPrivacyRef')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionIP')}</h2>
        <p>{t('legal.termsIP')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionDisclaimer')}</h2>
        <p>{t('legal.termsDisclaimer')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionLimitation')}</h2>
        <p>{t('legal.termsLimitation')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionIndemnity')}</h2>
        <p>{t('legal.termsIndemnity')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionTermination')}</h2>
        <p>{t('legal.termsTermination')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionChanges')}</h2>
        <p>{t('legal.termsChanges')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionGoverningLaw')}</h2>
        <p>{t('legal.termsGoverningLaw')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionContactTerms')}</h2>
        <p>{t('legal.termsContact')}</p>
      </div>
      <p className="mt-10 text-center text-sm">
        <Link href="/privacy" className="font-medium text-primary-600 hover:text-primary-700">
          {t('legal.privacyLink')}
        </Link>
      </p>
    </PublicPageShell>
  );
}
