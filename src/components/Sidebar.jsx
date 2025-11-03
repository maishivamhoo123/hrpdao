import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../utils/supabase';
import { 
  FaHome, 
  FaUser, 
  FaGlobe, 
  FaComments, 
  FaUsers, 
  FaBriefcase, 
  FaBell, 
  FaCog, 
  FaSignOutAlt,
  FaPlus,
} from 'react-icons/fa';
import countries from '../utils/countries';
import CreatePostModal from './CreatePostModal';

function Sidebar({ currentUser, onShowCreateModal }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // States for create post modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(currentUser?.country || '');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navItems = [
    { label: 'feed', path: '/feed', icon: <FaHome size={18} /> },
    { label: 'profile', path: '/profile', icon: <FaUser size={18} /> },
    { label: 'country', path: '/country', icon: <FaGlobe size={18} /> },
    { label: 'chat', path: '/chat', icon: <FaComments size={18} /> },
    { label: 'community', path: '/community', icon: <FaUsers size={18} /> },
    { label: 'services', path: '/services', icon: <FaBriefcase size={18} /> },
    { label: 'notifications', path: '/notifications', icon: <FaBell size={18} /> },
    { label: 'settings', path: '/settings', icon: <FaCog size={18} /> },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Помилка виходу:', err);
      alert(t('logoutError'));
    }
  };

  const isActive = (path) => location.pathname === path;

  const getCountryName = (countryCode) => {
    const countries = {
      'UA': { en: 'Ukraine', uk: 'Україна' },
      'US': { en: 'United States', uk: 'США' },
      'GB': { en: 'United Kingdom', uk: 'Великобританія' },
      'DE': { en: 'Germany', uk: 'Німеччина' },
      'FR': { en: 'France', uk: 'Франція' },
      'PL': { en: 'Poland', uk: 'Польща' },
    };
    
    const country = countries[countryCode];
    return country ? country[i18n.language] || country.en : countryCode;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex items-center text-left p-3 rounded-full transition-all duration-200${
              isActive(item.path)
                ? 'bg-accent text-blue-950'
                : 'text-blue-950 hover:bg-gray-100 hover:text-accent'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            <span className="text-sm font-medium">{t(item.label)}</span>
          </button>
        ))}
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full px-4 py-3 rounded-full font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-xl bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-950 hover:via-blue-900 hover:to-blue-800"
          aria-label={t('createPost')}
        >
          <FaPlus className="w-4 h-4" />
          {t('createPost') || 'Додати пост'}
        </button>
      </nav>

      {currentUser && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center flex-1 min-w-0">
              {currentUser.profile_picture ? (
                <img
                  src={currentUser.profile_picture}
                  alt={currentUser.username || t('user')}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                  <span className="text-gray-600 text-sm">
                    {currentUser.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {currentUser.username || currentUser.email}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {currentUser.status || t('member')}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="ml-3 p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label={t('logout')}
              title={t('logout')}
            >
              <FaSignOutAlt size={16} />
            </button>
          </div>
          
          {currentUser.country && (
            <div className="mt-2">
              <button
                onClick={() => navigate('/country')}
                className="flex items-center text-xs text-gray-500 hover:text-accent transition-colors duration-200 p-2 rounded-full hover:bg-gray-100"
                title={t('viewCountry')}
              >
                <FaGlobe size={12} className="mr-1" />
                <span>{getCountryName(currentUser.country)}</span>
              </button>
            </div>
          )}
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
          error={error}
          setError={setError}
          loading={loading}
          setLoading={setLoading}
          currentUser={currentUser}
          navigate={navigate}
        />
      )}
    </div>
  );
}

export default Sidebar;