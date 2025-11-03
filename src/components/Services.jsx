import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import countries from '../utils/countries';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';
import CreatePostModal from './CreatePostModal';
import { FaTimes, FaComments, FaHome } from 'react-icons/fa';
import { IoMdMegaphone } from 'react-icons/io';
import { BiSolidDonateHeart } from 'react-icons/bi';
import {
  FileText,
  GraduationCap,
  Heart,
  Scale,
  Building,
  Briefcase,
  Monitor,
  Leaf,
  Globe,
  Users,
  Plus
} from 'lucide-react';

const Services = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [userCountry, setUserCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredService, setHoveredService] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1023);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [createPostError, setCreatePostError] = useState(null);

  const leftColumnRef = useRef(null);
  const centerColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const isScrolling = useRef(false);

  const services = [
    {
      name: t('services.administrative'),
      path: (countryId) => `/services/${countryId}/administrative`,
      key: 'administrative',
      description: [
        t('services.administrativeDesc.citizenship'),
        t('services.administrativeDesc.documents'),
        t('services.administrativeDesc.taxes'),
        t('services.administrativeDesc.socialPayments'),
        t('services.administrativeDesc.businessReg'),
      ],
      icon: <FileText className="w-6 h-6" />,
    },
    {
      name: t('services.educationCulture'),
      path: (countryId) => `/services/${countryId}/education-culture`,
      key: 'education-culture',
      description: [
        t('services.educationCultureDesc.education'),
        t('services.educationCultureDesc.culturalPrograms'),
        t('services.educationCultureDesc.languageCourses'),
      ],
      icon: <GraduationCap className="w-6 h-6" />,
    },
    {
      name: t('services.healthcare'),
      path: (countryId) => `/services/${countryId}/healthcare`,
      key: 'healthcare',
      description: [
        t('services.healthcareDesc.medical'),
        t('services.healthcareDesc.insurance'),
        t('services.healthcareDesc.telemedicine'),
      ],
      icon: <Heart className="w-6 h-6" />,
    },
    {
      name: t('services.securityLaw'),
      path: (countryId) => `/services/${countryId}/security-law`,
      key: 'security-law',
      description: [
        t('services.securityLawDesc.police'),
        t('services.securityLawDesc.judicial'),
        t('services.securityLawDesc.cybersecurity'),
      ],
      icon: <Scale className="w-6 h-6" />,
    },
    {
      name: t('services.infrastructureUtilities'),
      path: (countryId) => `/services/${countryId}/infrastructure-utilities`,
      key: 'infrastructure-utilities',
      description: [
        t('services.infrastructureUtilitiesDesc.transport'),
        t('services.infrastructureUtilitiesDesc.utilities'),
        t('services.infrastructureUtilitiesDesc.housing'),
      ],
      icon: <Building className="w-6 h-6" />,
    },
    {
      name: t('services.economicFinancial'),
      path: (countryId) => `/services/${countryId}/economic-financial`,
      key: 'economic-financial',
      description: [
        t('services.economicFinancialDesc.businessSupport'),
        t('services.economicFinancialDesc.trade'),
      ],
      icon: <Briefcase className="w-6 h-6" />,
    },
    {
      name: t('services.digitalInformation'),
      path: (countryId) => `/services/${countryId}/digital-information`,
      key: 'digital-information',
      description: [
        t('services.digitalInformationDesc.egovernment'),
        t('services.digitalInformationDesc.news'),
        t('services.digitalInformationDesc.stats'),
      ],
      icon: <Monitor className="w-6 h-6" />,
    },
    {
      name: t('services.environmental'),
      path: (countryId) => `/services/${countryId}/environmental`,
      key: 'environmental',
      description: [
        t('services.environmentalDesc.protection'),
        t('services.environmentalDesc.greenInitiatives'),
      ],
      icon: <Leaf className="w-6 h-6" />,
    },
    {
      name: t('services.international'),
      path: (countryId) => `/services/${countryId}/international`,
      key: 'international',
      description: [
        t('services.internationalDesc.consular'),
        t('services.internationalDesc.peacekeeping'),
      ],
      icon: <Globe className="w-6 h-6" />,
    },
    {
      name: t('services.socialCommunity'),
      path: (countryId) => `/services/${countryId}/social-community`,
      key: 'social-community',
      description: [
        t('services.socialCommunityDesc.volunteering'),
        t('services.socialCommunityDesc.forums'),
        t('services.socialCommunityDesc.minorities'),
      ],
      icon: <Users className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1023);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        setCurrentUser(user);

        if (user) {
          const { data, error } = await supabase
            .from('users')
            .select('country')
            .eq('id', user.id)
            .single();
          if (error) throw error;
          setUserCountry(data?.country || 'ua');
          setSelectedCountry(data?.country || 'ua');
        } else {
          setUserCountry('ua');
          setSelectedCountry('ua');
        }
      } catch (err) {
        setError(err.message);
        setUserCountry('ua');
        setSelectedCountry('ua');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setTimeout(() => {
        setupSynchronizedScrolling();
      }, 100);
    }

    return () => {
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
  }, [isMobile, loading]);

  const setupSynchronizedScrolling = () => {
    if (isMobile) return;

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

  const handleCreatePostFromSidebar = () => {
    setShowCreateModal(true);
  };

  const handleComplaintClick = () => {
    if (isMobile) {
      setShowComplaintModal(true);
    }
  };

  const handleDonationClick = () => {
    if (isMobile) {
      setShowDonationModal(true);
    }
  };

  const displayCountry = userCountry || 'ua';
  const countryData = countries.find((c) => c.code.toLowerCase() === displayCountry?.toLowerCase());
  const countryName = countryData ? countryData.name[i18n.language] || countryData.name['en'] : 'Unknown';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg mx-4 text-center">
          <h2 className="text-xl font-semibold text-blue-950 mb-2">{t('error')}</h2>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
          >
            {t('tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col">
      <Navbar 
        currentUser={currentUser} 
        onShowCreateModal={handleCreatePostFromSidebar}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isMobile={isMobile}
      />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 h-full w-3/4 max-w-xs bg-white shadow-lg transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('menu')}</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="p-4">
              <Sidebar currentUser={currentUser} onShowCreateModal={handleCreatePostFromSidebar} />
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full mx-auto px-2 sm:px-4 grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 mt-2 sm:mt-4 pb-16 lg:pb-0">
        {!isMobile && (
          <div 
            ref={leftColumnRef}
            className="lg:col-span-3 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          >
            <Sidebar currentUser={currentUser} onShowCreateModal={handleCreatePostFromSidebar} />
          </div>
        )}
        
        <div 
          ref={centerColumnRef}
          className={`${isMobile ? 'w-full' : 'lg:col-span-6 overflow-y-auto'} space-y-3 sm:space-y-4`}
          style={!isMobile ? { maxHeight: 'calc(100vh - 80px)' } : {}}
        >
          <div className="bg-white/95 p-6 rounded-2xl shadow-lg border border-blue-100 backdrop-blur-sm mb-6">
            <div className="flex flex-col gap-2 mb-6">
              <h1 className="text-3xl font-bold text-blue-950">
                {t('services.title', { country: countryName })}
              </h1>
              <p className="text-blue-800">
                {t('yourCountry')}: <Link to="/country" className="font-medium text-blue-600 hover:text-blue-800 transition-colors">{countryName}</Link>
              </p>
            </div>
            
            <div className="mb-8">
              <Link
                to={`/services/${displayCountry}/add`}
                className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 text-base font-medium shadow-md hover:shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t('services.addService')}
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div 
                  key={service.key} 
                  className="relative bg-white/95 rounded-2xl border border-blue-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden backdrop-blur-sm"
                  onMouseEnter={() => setHoveredService(service.key)}
                  onMouseLeave={() => setHoveredService(null)}
                >
                  <Link
                    to={service.path(displayCountry)}
                    className="block p-5 h-full"
                  >
                    <div className="flex items-start">
                      <div className="text-blue-700 mr-4 mt-1">{service.icon}</div>
                      <div>
                        <h2 className="text-lg font-semibold text-blue-950 mb-2">{service.name}</h2>
                        {(hoveredService === service.key || isMobile) && (
                          <ul className="text-sm text-blue-800 space-y-1 mt-2">
                            {service.description.map((desc, index) => (
                              <li key={index} className="flex items-start">
                                <span className="mr-2">•</span> 
                                <span>{desc}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            {isMobile && (
              <div className="flex justify-between mt-3">
                <button 
                  className="flex items-center text-gray-500 text-xs sm:text-sm font-medium"
                  onClick={handleComplaintClick}
                >
                  <IoMdMegaphone className="mr-1 text-red-500 text-sm sm:text-base" />
                  {t('complaint')}
                </button>
                <button 
                  className="flex items-center text-gray-500 text-xs sm:text-sm font-medium"
                  onClick={handleDonationClick}
                >
                  <BiSolidDonateHeart className="mr-1 text-green-500 text-sm sm:text-base" />
                  {t('donate')}
                </button>
              </div>
            )}
          </div>
        </div>

        {!isMobile && (
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
        )}
      </div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between py-3 px-6 z-30">
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <FaHome className="w-5 h-5 mb-1" />
            <span>{t('home')}</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={handleComplaintClick}
          >
            <IoMdMegaphone className="w-5 h-5 mb-1" />
            <span>{t('complaints')}</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={handleCreatePostFromSidebar}
          >
            <div className="relative">
              <Plus className="w-5 h-5 mb-1" />
            </div>
            <span>{t('create')}</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={handleDonationClick}
          >
            <BiSolidDonateHeart className="w-5 h-5 mb-1" />
            <span>{t('donate')}</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={() => navigate('/chat')}
          >
            <FaComments className="w-5 h-5 mb-1" />
            <span>{t('chat')}</span>
          </button>
        </div>
      )}

      {showComplaintModal && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-blue-950">{t('submitComplaint')}</h2>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="p-1 sm:p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-gray-500 text-lg" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <ComplaintForm setError={setError} error={error} />
            </div>
          </div>
        </div>
      )}

      {showDonationModal && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-blue-950">{t('donate')}</h2>
              <button
                onClick={() => setShowDonationModal(false)}
                className="p-1 sm:p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="text-gray-500 text-lg" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <DonationSection />
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreatePostModal
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          newPostContent={newPostContent}
          setNewPostContent={setNewPostContent}
          newPostMedia={newPostMedia}
          setNewPostMedia={setNewPostMedia}
          mediaPreview={mediaPreview}
          setMediaPreview={setMediaPreview}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          error={createPostError}
          setError={setCreatePostError}
          loading={createPostLoading}
          setLoading={setCreatePostLoading}
          currentUser={currentUser}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default Services;