import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// Lucide Icons
import { 
  Heart,
  ChevronDown, 
  Check, 
  X,
  Bitcoin,
  CreditCard,
  Coins
} from 'lucide-react';

function DonationSection() {
  const { t } = useTranslation();
  const [showDonationDetails, setShowDonationDetails] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDonationClick = () => {
    setShowDonationDetails(!showDonationDetails);
    if (success) setSuccess(false);
  };

  const handleCopyAddress = (address, type) => {
    navigator.clipboard.writeText(address);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/95 p-6 rounded-2xl shadow-lg relative overflow-hidden border border-blue-100 backdrop-blur-sm"
    >
      <div className="relative z-10">
        <button
          onClick={handleDonationClick}
          className={`w-full px-4 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-xl text-sm ${
            showDonationDetails 
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
              : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 text-white'
          }`}
          aria-label={showDonationDetails ? t('hideDetails') || 'Приховати деталі' : t('donateNow') || 'Пожертвувати зараз'}
        >
          {showDonationDetails ? (
            <>
              <X className="w-4 h-4" />
              {t('hideDetails') || 'Приховати деталі'}
            </>
          ) : (
            <>
              <Heart className="w-4 h-4" />
              {t('donateNow') || 'Пожертвувати зараз'}
            </>
          )}
        </button>
        
        <p className="text-center mt-2 mb-4 text-blue-950 text-sm opacity-80">
          {t('donationDescription') || 'Ваша підтримка допомагає нам продовжувати боротьбу за права людини'}
        </p>
        
        <AnimatePresence>
          {showDonationDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-blue-100">
                <h3 className="text-lg font-semibold mb-4 text-blue-950 text-center">
                  {t('donationDetails') || 'Деталі пожертв'}
                </h3>
                
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-green-50 text-green-800 rounded-full border border-green-100 flex items-start gap-3 shadow-sm"
                  >
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{t('copiedToClipboard') || 'Адресу скопійовано!'}</p>
                      <p className="text-sm mt-1 text-green-700 opacity-90">{t('thankYouForDonation') || 'Дякуємо за вашу підтримку!'}</p>
                    </div>
                  </motion.div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('bitcoin') || 'Bitcoin'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm pr-12"
                      />
                      <button
                        onClick={() => handleCopyAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'bitcoin')}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        aria-label={t('copyAddress') || 'Копіювати адресу'}
                      >
                        <Bitcoin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('ethereum') || 'Ethereum'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm pr-12"
                      />
                      <button
                        onClick={() => handleCopyAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'ethereum')}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        aria-label={t('copyAddress') || 'Копіювати адресу'}
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('bankCard') || 'Банківська карта'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="5375 4141 0909 8080"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm pr-12"
                      />
                      <button
                        onClick={() => handleCopyAddress('5375 4141 0909 8080', 'card')}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        aria-label={t('copyAddress') || 'Копіювати адресу'}
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('paypal') || 'PayPal'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="donate@humanrightsworld.org"
                        readOnly
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm pr-12"
                      />
                      <button
                        onClick={() => handleCopyAddress('donate@humanrightsworld.org', 'paypal')}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                        aria-label={t('copyAddress') || 'Копіювати адресу'}
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="text-center mt-4 text-sm text-blue-700 opacity-80">
                  {t('donationNote') || 'Оберіть зручний для вас спосіб пожертви. Дякуємо за вашу підтримку!'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default DonationSection;