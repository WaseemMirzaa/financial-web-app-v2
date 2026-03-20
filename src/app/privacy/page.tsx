'use client';

import Link from 'next/link';
import { PublicPageShell } from '@/components/PublicPageShell';
import { useLocale } from '@/contexts/LocaleContext';
import { Loader } from '@/components/ui/Loader';

export default function PrivacyPage() {
  const { t, isInitialized } = useLocale();

  if (!isInitialized) {
    return <Loader fullScreen text={t('common.loading')} />;
  }

  return (
    <PublicPageShell title={t('legal.privacyTitle')}>
      <p className="text-sm font-medium text-primary-700 mb-1">{t('legal.privacyBrand')}</p>
      <p className="text-sm text-neutral-600 mb-6">{t('legal.lastUpdated')}</p>
      <div className="prose prose-neutral max-w-none text-sm leading-relaxed space-y-4">
        <p>{t('legal.privacyIntro')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionGathering')}</h2>
        <p>{t('legal.privacyGatherIntro')}</p>
        <ul className="list-disc ps-5 space-y-1 text-neutral-800">
          <li>{t('legal.privacyGather1')}</li>
          <li>{t('legal.privacyGather2')}</li>
          <li>{t('legal.privacyGather3')}</li>
          <li>{t('legal.privacyGather4')}</li>
        </ul>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionUsingInfo')}</h2>
        <p>{t('legal.privacyUseIntro')}</p>
        <ul className="list-disc ps-5 space-y-1 text-neutral-800">
          <li>{t('legal.privacyUse1')}</li>
          <li>{t('legal.privacyUse2')}</li>
          <li>{t('legal.privacyUse3')}</li>
          <li>{t('legal.privacyUse4')}</li>
        </ul>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionInfoProtection')}</h2>
        <p>{t('legal.privacyProtection')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionSharing')}</h2>
        <p>{t('legal.privacySharingIntro')}</p>
        <ul className="list-disc ps-5 space-y-1 text-neutral-800">
          <li>{t('legal.privacySharing1')}</li>
          <li>{t('legal.privacySharing2')}</li>
          <li>{t('legal.privacySharing3')}</li>
        </ul>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionCookies')}</h2>
        <p>{t('legal.privacyCookies')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionUserRights')}</h2>
        <p>{t('legal.privacyUserRights')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionAmendments')}</h2>
        <p>{t('legal.privacyAmendments')}</p>

        <h2 className="text-base font-semibold text-neutral-900 pt-2">{t('legal.sectionContactPrivacy')}</h2>
        <p>{t('legal.privacyContact')}</p>
      </div>
      <p className="mt-10 text-center text-sm">
        <Link href="/terms" className="font-medium text-primary-600 hover:text-primary-700">
          {t('legal.termsLink')}
        </Link>
      </p>
    </PublicPageShell>
  );
}
