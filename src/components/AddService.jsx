import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import countries from '../utils/countries';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';

const AddService = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    service_type: '',
    company_name: '',
    phone: '',
    address: '',
    cost: '',
    description: '',
    country: id || '',
  });
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Refs for columns
  const leftColumnRef = useRef(null);
  const centerColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const isScrolling = useRef(false);

  const serviceTypes = [
    { key: 'administrative', name: t('services.administrative') },
    { key: 'education-culture', name: t('services.educationCulture') },
    { key: 'healthcare', name: t('services.healthcare') },
    { key: 'security-law', name: t('services.securityLaw') },
    { key: 'infrastructure-utilities', name: t('services.infrastructureUtilities') },
    { key: 'economic-financial', name: t('services.economicFinancial') },
    { key: 'digital-information', name: t('services.digitalInformation') },
    { key: 'environmental', name: t('services.environmental') },
    { key: 'international', name: t('services.international') },
    { key: 'social-community', name: t('services.socialCommunity') },
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          console.error('Помилка автентифікації:', authError);
          setError(t('errors.userNotAuthenticated'));
          setLoading(false);
          return;
        }
        
        setCurrentUser(user);

        if (user) {
          if (!id) {
            const { data, error } = await supabase
              .from('users')
              .select('country')
              .eq('id', user.id)
              .single();
            
            if (error) {
              console.error('Помилка отримання профілю:', error);
              setError(t('errors.profileFetchFailed'));
            } else if (data && data.country) {
              setFormData((prev) => ({ ...prev, country: data.country.toLowerCase() }));
            }
          }
        }
      } catch (err) {
        console.error('Помилка:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, t]);

  useEffect(() => {
    // Adding scroll handlers after content loads
    setTimeout(() => {
      setupSynchronizedScrolling();
    }, 100);

    return () => {
      // Remove handlers when the component is destroyed
      if (leftColumnRef.current) {
        leftColumnRef.current.removeEventListener('scroll', handleLeftScroll);
      }
      if (centerColumnRef.current) {
        centerColumnRef.current.removeEventListener('scroll', handleCenterScroll);
      }
      if (rightColumnRef.current) {
        rightColumnRef.current.removeEventListener('scroll', handleRightScroll);
      }
    };
  }, [loading]);

  const setupSynchronizedScrolling = () => {
    const leftColumn = leftColumnRef.current;
    const centerColumn = centerColumnRef.current;
    const rightColumn = rightColumnRef.current;

    if (leftColumn && centerColumn && rightColumn) {
      leftColumn.addEventListener('scroll', handleLeftScroll);
      centerColumn.addEventListener('scroll', handleCenterScroll);
      rightColumn.addEventListener('scroll', handleRightScroll);
    }
  };

  const handleLeftScroll = (e) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const leftColumn = leftColumnRef.current;
    const centerColumn = centerColumnRef.current;
    const rightColumn = rightColumnRef.current;

    if (leftColumn && centerColumn && rightColumn) {
      const scrollPercentage = leftColumn.scrollTop / (leftColumn.scrollHeight - leftColumn.clientHeight);
      
      centerColumn.scrollTop = scrollPercentage * (centerColumn.scrollHeight - centerColumn.clientHeight);
      rightColumn.scrollTop = scrollPercentage * (rightColumn.scrollHeight - rightColumn.clientHeight);
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  };

  const handleCenterScroll = (e) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const leftColumn = leftColumnRef.current;
    const centerColumn = centerColumnRef.current;
    const rightColumn = rightColumnRef.current;

    if (leftColumn && centerColumn && rightColumn) {
      const scrollPercentage = centerColumn.scrollTop / (centerColumn.scrollHeight - centerColumn.clientHeight);
      
      leftColumn.scrollTop = scrollPercentage * (leftColumn.scrollHeight - leftColumn.clientHeight);
      rightColumn.scrollTop = scrollPercentage * (rightColumn.scrollHeight - rightColumn.clientHeight);
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  };

  const handleRightScroll = (e) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const leftColumn = leftColumnRef.current;
    const centerColumn = centerColumnRef.current;
    const rightColumn = rightColumnRef.current;

    if (leftColumn && centerColumn && rightColumn) {
      const scrollPercentage = rightColumn.scrollTop / (rightColumn.scrollHeight - rightColumn.clientHeight);
      
      leftColumn.scrollTop = scrollPercentage * (leftColumn.scrollHeight - leftColumn.clientHeight);
      centerColumn.scrollTop = scrollPercentage * (centerColumn.scrollHeight - centerColumn.clientHeight);
    }

    setTimeout(() => {
      isScrolling.current = false;
    }, 50);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError(t('errors.userNotAuthenticated'));
      return;
    }
    if (!formData.service_type || !formData.company_name || !formData.country) {
      setError(t('errors.requiredFields'));
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .insert({
          service_type: formData.service_type,
          company_name: formData.company_name,
          phone: formData.phone,
          address: formData.address,
          cost: formData.cost,
          description: formData.description,
          country: formData.country.toLowerCase(),
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      navigate(`/services/${formData.country.toLowerCase()}/${formData.service_type}`);
    } catch (err) {
      console.error('Помилка додавання сервісу:', err);
      setError(t('errors.addServiceFailed'));
    }
  };

  const countryOptions = countries.map(({ code, name }) => ({
    value: code.toLowerCase(),
    label: name[i18n.language] || name['en'],
  }));

  if (loading) {
    return <div className="p-4 text-center">{t('loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar currentUser={currentUser} />
      
      <div className="w-full mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 mt-4 pb-8">
        {/* Left panel - Sidebar */}
        <div 
          ref={leftColumnRef}
          className="lg:col-span-3 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          <Sidebar addPostButton={false} currentUser={currentUser} />
        </div>
        
        {/* Central panel - service addition form */}
        <div 
          ref={centerColumnRef}
          className="lg:col-span-6 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          <div className="bg-white/95 p-6 rounded-2xl shadow-lg border border-blue-100 backdrop-blur-sm mb-6">
            <h1 className="text-3xl font-bold text-blue-950 mb-6">{t('services.addService')}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.serviceType')}
                </label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">{t('services.selectServiceType')}</option>
                  {serviceTypes.map((type) => (
                    <option key={type.key} value={type.key}>{type.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.country')}
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">{t('services.searchCountry')}</option>
                  {countryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.companyName')}
                </label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.phone')}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.address')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.cost')}
                </label>
                <input
                  type="text"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-950 mb-2">
                  {t('services.description')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  rows={4}
                />
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-2xl border border-red-100 flex items-start gap-3 shadow-sm">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                {t('services.addServiceButton')}
              </button>
            </form>
          </div>
        </div>

        {/* Right panel - ComplaintForm and DonationSection */}
        <div 
          ref={rightColumnRef}
          className="lg:col-span-3 space-y-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          <div>
            <ComplaintForm setError={setError} error={error} />
          </div>
          <div>
            <DonationSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddService;