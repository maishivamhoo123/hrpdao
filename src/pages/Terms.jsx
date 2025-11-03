import { useTranslation } from 'react-i18next';

function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 text-navy p-8">
      <h1 className="text-3xl font-bold text-gold mb-6">{t('termsLink')}</h1>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gold mb-4">{t('termsOfService')}</h2>
        <p className="mb-4">{t('termsIntro')}</p>
        <h3 className="text-lg font-semibold mb-2">1. {t('termsUsage')}</h3>
        <p className="mb-4">
          {t('termsUsage')} You must not use the platform for any unlawful purpose, including but not limited to hate speech, harassment, or sharing illegal content. We may suspend or terminate accounts that violate these terms without prior notice.
        </p>
        <h3 className="text-lg font-semibold mb-2">2. {t('termsAccount')}</h3>
        <p className="mb-4">
          {t('termsAccount')} You must provide accurate information during registration and keep your account credentials secure.
        </p>
        <h3 className="text-lg font-semibold mb-2">3. {t('termsChanges')}</h3>
        <p className="mb-4">
          {t('termsChanges')} We will notify users of significant changes via email or platform announcements.
        </p>

        <h2 className="text-xl font-bold text-gold mb-4 mt-8">{t('privacyPolicy')}</h2>
        <p className="mb-4">{t('privacyIntro')}</p>
        <h3 className="text-lg font-semibold mb-2">1. {t('privacyCollection')}</h3>
        <p className="mb-4">
          {t('privacyCollection')} This includes email, phone number, username, country, and optional geolocation data. We may also collect usage data to improve our services.
        </p>
        <h3 className="text-lg font-semibold mb-2">2. {t('privacyUsage')}</h3>
        <p className="mb-4">
          {t('privacyUsage')} Data is not shared with third parties except as required by law or with your explicit consent.
        </p>
        <h3 className="text-lg font-semibold mb-2">3. {t('privacySecurity')}</h3>
        <p className="mb-4">
          {t('privacySecurity')} We use encryption and other industry-standard measures, but no system is entirely secure.
        </p>
        <h3 className="text-lg font-semibold mb-2">4. {t('privacyRights')}</h3>
        <p className="mb-4">
          {t('privacyRights')} You may request data deletion or portability by contacting us. We comply with applicable data protection laws, including GDPR where relevant.
        </p>
        <p className="mt-6">
          For questions or concerns, contact us at <a href="mailto:privacy@humanrightsworld.org" className="underline">privacy@humanrightsworld.org</a>.
        </p>
      </div>
    </div>
  );
}

export default Terms;