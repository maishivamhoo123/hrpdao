import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import { supabase } from '../utils/supabase';
import countries from '../utils/countries';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';
import SocialFeed from './SocialFeed';
import CreatePostModal from './CreatePostModal';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaInfoCircle, FaMapMarkerAlt, FaBars, FaTimes, FaHome, FaComments, FaUserCircle, FaPlus } from 'react-icons/fa';
import { IoMdMegaphone } from 'react-icons/io';
import { BiSolidDonateHeart } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const customIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-shadow.png',
  shadowSize: [41, 41],
});

const countryCoordinates = {
  UA: [48.3794, 31.1656],
  AE: [23.4241, 53.8478],
  GB: [55.3781, -3.4360],
  US: [37.0902, -95.7129],
  UY: [-32.5228, -55.7658],
  UZ: [41.3775, 64.5853],
  VU: [-15.3767, 166.9592],
  VA: [41.9029, 12.4534],
  VE: [6.4238, -66.5897],
  VN: [14.0583, 108.2772],
  YE: [15.5527, 48.5164],
  ZM: [-13.1339, 27.8493],
  ZW: [-19.0154, 29.1549],
  CD: [-4.0383, 21.7587],
  CG: [-0.2280, 15.8277],
  GH: [7.9465, -1.0232],
  SO: [5.1521, 46.1996],
};

function Country() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [country, setCountry] = useState('');
  const [userCountry, setUserCountry] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const [geolocationAccepted, setGeolocationAccepted] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [freedomRatings, setFreedomRatings] = useState({
    speech_freedom: 0,
    economic_freedom: 0,
    political_freedom: 0,
    human_rights_freedom: 0,
    overall_freedom: 0,
  });
  const [users, setUsers] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
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

  const geoUrl = 'https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1023);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
  }, [isLoadingData, isMobile]);

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

  const handleGeolocation = () => {
    setIsLoading(true);
    setError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const countryCode = countries.find(c => c.name.en === data.countryName)?.code || '';
            if (countryCode) {
              setCountry(countryCode);
              setGeolocationAccepted(true);
              await fetchCountryData(countryCode);
            } else {
              setError(t('countryNotFound') || 'Країну не знайдено');
            }
            setIsLoading(false);
          } catch (err) {
            console.error('Помилка геолокації:', err);
            setError(t('geolocationError') || 'Помилка отримання геолокації');
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('Помилка геолокації:', err);
          setError(t('geolocationNotSupported') || 'Геолокація не підтримується або доступ заборонено');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError(t('geolocationNotSupported') || 'Геолокація не підтримується вашим браузером');
      setIsLoading(false);
    }
  };

  const fetchCountryData = async (countryCode) => {
    setIsLoadingData(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, username, profile_picture, country, city, status, bio')
        .eq('country', countryCode);
      
      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('freedom_ratings')
        .select('speech_freedom, economic_freedom, political_freedom, human_rights_freedom')
        .eq('country_code', countryCode);

      if (ratingsError && ratingsError.code !== 'PGRST116') throw ratingsError;

      console.log('Ratings data for country', countryCode, ':', ratingsData);

      if (ratingsData && ratingsData.length > 0) {
        const validRatings = ratingsData.filter(rating => 
          rating.speech_freedom !== null && rating.economic_freedom !== null && 
          rating.political_freedom !== null && rating.human_rights_freedom !== null
        );

        console.log('Valid ratings:', validRatings);

        if (validRatings.length > 0) {
          const averages = validRatings.reduce(
            (acc, curr) => ({
              speech_freedom: acc.speech_freedom + (parseInt(curr.speech_freedom) || 0),
              economic_freedom: acc.economic_freedom + (parseInt(curr.economic_freedom) || 0),
              political_freedom: acc.political_freedom + (parseInt(curr.political_freedom) || 0),
              human_rights_freedom: acc.human_rights_freedom + (parseInt(curr.human_rights_freedom) || 0),
            }),
            { speech_freedom: 0, economic_freedom: 0, political_freedom: 0, human_rights_freedom: 0 }
          );

          const count = validRatings.length;
          const updatedRatings = {
            speech_freedom: (averages.speech_freedom / count).toFixed(1),
            economic_freedom: (averages.economic_freedom / count).toFixed(1),
            political_freedom: (averages.political_freedom / count).toFixed(1),
            human_rights_freedom: (averages.human_rights_freedom / count).toFixed(1),
            overall_freedom: (
              (averages.speech_freedom + averages.economic_freedom + 
               averages.political_freedom + averages.human_rights_freedom) /
              (count * 4)
            ).toFixed(1)
          };
          
          console.log('Calculated averages:', updatedRatings);
          setFreedomRatings(updatedRatings);
        } else {
          setFreedomRatings({
            speech_freedom: 0,
            economic_freedom: 0,
            political_freedom: 0,
            human_rights_freedom: 0,
            overall_freedom: 0,
          });
        }
      } else {
        setFreedomRatings({
          speech_freedom: 0,
          economic_freedom: 0,
          political_freedom: 0,
          human_rights_freedom: 0,
          overall_freedom: 0,
        });
      }
    } catch (err) {
      console.error('Помилка завантаження даних країни:', err);
      setError(t('dataError') || 'Помилка завантаження даних');
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
          setCurrentUser(userData);
          if (userData.country) {
            setSelectedCountry(userData.country);
          }
        }
      } catch (err) {
        console.error('Помилка завантаження даних користувача:', err);
      }
    };

    const fetchUserCountry = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Помилка авторизації:', authError);
          return;
        }
        const { data, error } = await supabase
          .from('users')
          .select('country')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (data && data.country) {
          setUserCountry(data.country);
          setCountry(data.country);
          fetchCountryData(data.country);
        }
      } catch (err) {
        console.error('Помилка завантаження країни користувача:', err);
      }
    };

    const fetchGeoData = async () => {
      try {
        const response = await fetch(geoUrl);
        if (!response.ok) throw new Error('Failed to fetch GeoJSON');
        const data = await response.json();
        setGeoData(data);
      } catch (err) {
        console.error('Помилка завантаження GeoJSON:', err);
        setError(t('geoJsonError') || 'Помилка завантаження карти');
      }
    };

    fetchCurrentUser();
    fetchUserCountry();
    fetchGeoData();
  }, [t]);

  const handleMemberClick = (userId) => {
    navigate(`/public/${userId}`);
  };

  const handleComplaintClick = () => {
    setShowComplaintModal(true);
  };

  const handleDonationClick = () => {
    setShowDonationModal(true);
  };

  const handleCreatePostFromSidebar = () => {
    setShowCreateModal(true);
  };

  const countryName = countries.find((c) => c.code === country)?.name[i18n.language] || t('unknown');

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg text-red-500 text-center">
        {t('error')}: {error}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col">
      <Navbar 
        currentUser={currentUser} 
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isMobile={isMobile}
      />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && isMobile && (
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
              <Sidebar currentUser={currentUser} addPostButton={false} onShowCreateModal={handleCreatePostFromSidebar} />
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 mt-4 pb-16 lg:pb-0">
        {/* Left panel - Sidebar (hidden on mobile devices) */}
        {!isMobile && (
          <div 
            ref={leftColumnRef}
            className="lg:col-span-3 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          >
            <Sidebar currentUser={currentUser} addPostButton={false} onShowCreateModal={handleCreatePostFromSidebar} />
          </div>
        )}
        
        {/* Central panel */}
        <div 
          ref={centerColumnRef}
          className="lg:col-span-6 overflow-y-auto space-y-4"
          style={{ maxHeight: 'calc(100vh - 80px)' }}
        >
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              {userCountry && (
                <p className="text-gray-900 font-semibold mb-4 md:mb-0 text-center md:text-left">
                  {t('yourCountry')}: {countries.find((c) => c.code === userCountry)?.name[i18n.language || 'en'] || t('unknown')}
                </p>
              )}
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <select
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setGeolocationAccepted(true);
                      if (e.target.value) fetchCountryData(e.target.value);
                    }}
                    className="w-full md:w-48 px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-blue-950 text-sm shadow-sm"
                    aria-label={t('selectCountry')}
                  >
                    <option value="">{t('selectCountry')}</option>
                    {countries.map(({ code, name }) => (
                      <option key={code} value={code}>{name[i18n.language]}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
                
                <button
                  onClick={handleGeolocation}
                  className="p-2 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                  disabled={isLoading}
                  title={t('useGeolocation')}
                >
                  <FaMapMarkerAlt className="text-blue-600 w-5 h-5" />
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-2 text-red-500 text-sm text-center">
                {error}
              </div>
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm"
          >
            {geoData ? (
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: '300px', width: '100%' }}
                className="rounded-lg border border-gray-200"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <GeoJSON
                  data={geoData}
                  style={() => ({
                    fillColor: '#3B82F6',
                    weight: 1,
                    opacity: 1,
                    color: '#1E40AF',
                    fillOpacity: 0.6,
                  })}
                  onEachFeature={(feature, layer) => {
                    const countryCode = feature.properties.ISO_A2;
                    layer.on({
                      click: () => {
                        setCountry(countryCode);
                        fetchCountryData(countryCode);
                      },
                    });
                    layer.bindPopup(
                      countries.find((c) => c.code === countryCode)?.name[i18n.language || 'en'] ||
                        feature.properties.name
                    );
                  }}
                />
                {Object.entries(countryCoordinates).map(([code, coords]) => (
                  <Marker key={code} position={coords} icon={customIcon}>
                    <Popup>
                      {countries.find((c) => c.code === code)?.name[i18n.language || 'en'] || code}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="text-gray-900 text-center">{t('loadingMap')}</div>
            )}
          </motion.div>

          {/* Country details */}
          {country && (
            <>
              {/* Country title and service links */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm flex justify-between items-center"
              >
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t('countryDetailTitle', { country: countryName })}</h1>
                <Link
                  to={`/services/${country}`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-700 transition-all duration-300"
                >
                  {t('services.title', { country: countryName })}
                </Link>
              </motion.div>

              {/* Freedom ratings */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('freedomRatings')}</h2>
                {isLoadingData ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-gray-600 mt-2">{t('loading')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {['overall_freedom', 'speech_freedom', 'economic_freedom', 'political_freedom', 'human_rights_freedom'].map((key) => (
                      <div key={key} className="relative group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-900">{t(key)}</span>
                          <span className="text-sm font-semibold text-blue-600">{freedomRatings[key]}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-1">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(parseFloat(freedomRatings[key]) / 10) * 100}%` }}
                          ></div>
                        </div>
                        <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white shadow-lg p-3 rounded-lg z-10 border border-gray-200 min-w-[200px]">
                          <FaInfoCircle className="text-blue-600 text-sm inline mr-1" />
                          <span className="text-xs text-gray-700">{t(`${key}Tooltip`)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Social feed for the country */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('postsFromCountry', { country: countryName })}</h2>
                <SocialFeed userId={null} countryCode={country} />
              </motion.div>
            </>
          )}
        </div>
        
        {/* Right panel - ComplaintForm and DonationSection (hidden on mobile devices) */}
        {!isMobile && (
          <div 
            ref={rightColumnRef}
            className="lg:col-span-3 space-y-4 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 80px)' }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ComplaintForm setError={setError} error={error} />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <DonationSection />
            </motion.div>

            {/* List of users */}
            {country && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">{t('usersFromCountry', { country: countryName })}</h3>
                {users.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t('noUsers')}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleMemberClick(user.id)}
                      >
                        <img
                          src={user.profile_picture || 'https://placehold.co/40x40'}
                          alt={user.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <span className="text-gray-900 font-medium">
                          {user.username || t('anonymous')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between py-3 px-6 z-30">
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={() => navigate('/feed')}
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
              <FaPlus className="w-5 h-5 mb-1" />
            </div>
            <span>{t('create')}</span>
          </button>
          
          <button 
            className="flex flex-col items-center text-xs text-gray-600"
            onClick={handleDonationClick}
          >
            <BiSolidDonateHeart className="w-5 h-5 mb-1" />
            <span>{t('donations')}</span>
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

      {/* Complaint Modal for Mobile */}
      {showComplaintModal && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-h-[90vh] rounded-t-3xl overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-lg font-semibold">{t('complaint')}</h2>
              <button 
                onClick={() => setShowComplaintModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <ComplaintForm setError={setError} error={error} onClose={() => setShowComplaintModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal for Mobile */}
      {showDonationModal && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-h-[90vh] rounded-t-3xl overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-3xl">
              <h2 className="text-lg font-semibold">{t('donations')}</h2>
              <button 
                onClick={() => setShowDonationModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <DonationSection onClose={() => setShowDonationModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Post creation modal window */}
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
}

export default Country;