import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <select
      onChange={(e) => handleLanguageChange(e.target.value)}
      value={i18n.language}
      className="w-32 text-sm border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
      aria-label={t('selectLanguage')}
    >
      <option value="uk">Українська</option>
      <option value="en">English</option>
    </select>
  );
}

export default LanguageSelector;