import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import countries from '../utils/countries';

// Lucide Icons
import { 
  Upload, 
  ChevronDown, 
  Check, 
  X,
  FileText,
  Shield
} from 'lucide-react';

function ComplaintForm({ setError, error }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: '',
    contact_info: '',
    description: '',
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('country')
            .eq('id', user.id)
            .single();
          if (error) throw error;
          const countryCode = data?.country || 'UA';
          setFormData((prev) => ({ ...prev, country: countryCode }));
        } else {
          setFormData((prev) => ({ ...prev, country: 'UA' }));
        }
      } catch (err) {
        setError(err.message || t('error'));
        setFormData((prev) => ({ ...prev, country: 'UA' }));
      }
    };

    fetchUserCountry();
  }, [t, setError]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => {
        const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        if (!isValidType) setError(t('complaint.invalidFileType'));
        if (!isValidSize) setError(t('complaint.fileTooLarge'));
        return isValidType && isValidSize;
      });
      setEvidenceFiles(validFiles);
    }
  };

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(t('authRequired'));
      navigate('/');
      setSubmitting(false);
      return;
    }

    if (!formData.description) {
      setError(t('emptyComplaint'));
      setSubmitting(false);
      return;
    }

    try {
      let evidenceUrls = [];
      if (evidenceFiles.length > 0) {
        const fileUploads = evidenceFiles.map(async (file) => {
          const filePath = `complaints/${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from('complaints').upload(filePath, file);
          if (uploadError) throw uploadError;
          const { data } = supabase.storage.from('complaints').getPublicUrl(filePath);
          return data.publicUrl;
        });
        evidenceUrls = await Promise.all(fileUploads);
      }

      const complaintData = {
        user_id: user.id,
        full_name: isAnonymous ? 'Anonymous' : null,
        country: formData.country,
        contact_info: isAnonymous ? 'Hidden' : formData.contact_info,
        content: formData.description,
        evidence_urls: evidenceUrls.length > 0 ? evidenceUrls : null,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('complaints').insert(complaintData);
      if (error) throw error;

      setSuccess(true);
      setFormData({ country: formData.country, contact_info: '', description: '' });
      setEvidenceFiles([]);
      setIsAnonymous(false);
      setTimeout(() => {
        setShowForm(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Помилка подачі скарги:', err);
      setError(err.message || t('complaintError'));
    } finally {
      setSubmitting(false);
    }
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
          onClick={() => setShowForm(!showForm)}
          className={`w-full px-4 py-3 rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-xl text-sm ${
            showForm 
              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
              : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 text-white'
          }`}
          aria-label={showForm ? t('hideForm') || 'Приховати форму' : t('submitComplaint') || 'Подати скаргу'}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              {t('hideForm') || 'Приховати форму'}
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              {t('submitComplaint') || 'Подати скаргу'}
            </>
          )}
        </button>
        
        <p className="text-center mt-2 mb-4 text-blue-950 text-sm opacity-80">
          {t('complaint.subtitle') || 'Поділіться своїми скаргами та допоможіть нам покращити наш сервіс'}
        </p>
        
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-blue-100">
                <h3 className="text-lg font-semibold mb-4 text-blue-950 text-center">
                  {t('submitComplaint')}
                </h3>
                
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-green-50 text-green-800 rounded-full border border-green-100 flex items-start gap-3 shadow-sm"
                  >
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{t('complaintSubmitted')}</p>
                      <p className="text-sm mt-1 text-green-700 opacity-90">{t('complaint.thankYou') || 'Дякуємо за ваш відгук!'}</p>
                    </div>
                  </motion.div>
                )}
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-50 text-red-800 rounded-full border border-red-100 flex items-start gap-3 shadow-sm"
                  >
                    <X className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{t('error') || 'Помилка'}</p>
                      <p className="text-sm mt-1 text-red-700 opacity-90">{error}</p>
                    </div>
                  </motion.div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('complaint.country') || 'Країна'}
                    </label>
                    <div className="relative">
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-blue-950 text-sm shadow-sm"
                        aria-label={t('complaint.country') || 'Країна'}
                        required
                      >
                        <option value="" disabled>
                          {t('complaint.selectCountry') || 'Оберіть країну'}
                        </option>
                        {countries.map(({ code, name }) => (
                          <option key={code} value={code}>
                            {name[i18n.language] || name.en}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('complaint.contactInfo')}
                    </label>
                    <input
                      type="text"
                      name="contact_info"
                      value={isAnonymous ? 'Hidden' : formData.contact_info}
                      onChange={handleInputChange}
                      disabled={isAnonymous}
                      placeholder={t('complaint.contactPlaceholder') || 'Email або телефон'}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 text-blue-950 text-sm shadow-sm"
                      required={!isAnonymous}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('complaint.description')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder={t('complaint.descriptionPlaceholder') || 'Опишіть вашу скаргу детально...'}
                      className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-vertical min-h-[100px] text-blue-950 text-sm shadow-sm"
                      rows={4}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-1.5">
                      {t('complaint.evidence')}
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-200 rounded-full cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 p-4">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-5 h-5 mb-2 text-gray-500" />
                          <p className="text-sm text-gray-600 text-center">
                            <span className="font-medium">{t('complaint.clickToUpload') || 'Натисніть для завантаження'}</span>
                            <br />
                            <span className="text-xs opacity-80">{t('complaint.uploadRestrictions') || 'PNG, JPG, GIF, MP4 (макс. 5MB)'}</span>
                          </p>
                        </div>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*" 
                          onChange={handleFileChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    
                    {evidenceFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-blue-950">{t('complaint.uploadedFiles') || 'Завантажені файли:'}</p>
                        {evidenceFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-full text-sm shadow-sm">
                            <span className="text-gray-700 truncate max-w-xs">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              aria-label={t('removeFile') || 'Видалити файл'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <label className="relative flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full ${isAnonymous ? 'bg-blue-500' : 'bg-gray-300'} transition-colors duration-200 shadow-inner`}></div>
                      <div className={`absolute left-0.5 top-0.5 bg-white border border-gray-200 rounded-full h-4 w-4 transition-transform duration-200 shadow-sm ${isAnonymous ? 'transform translate-x-5' : ''}`}></div>
                    </label>
                    <span className="ml-3 text-sm text-blue-950">
                      {t('complaint.anonymous')}
                    </span>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full px-4 py-3 rounded-full font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-xl ${
                      submitting 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-950 hover:via-blue-900 hover:to-blue-800'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('complaint.submitting')}
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        {t('submitComplaint')}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default ComplaintForm;