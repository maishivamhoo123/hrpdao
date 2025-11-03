import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  FaSearch, 
  FaUserCircle,
  FaTimes,
  FaPaperclip,
  FaWallet,
  FaBars
} from 'react-icons/fa';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../utils/supabase';
import countries from '../utils/countries';

function Navbar({ currentUser, onToggleSidebar, onToggleSearch }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUserCountry = async () => {
      if (currentUser?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('country, profile_picture')
          .eq('id', currentUser.id)
          .single();
        if (!profileError && profile?.country) {
          setSelectedCountry(profile.country);
          setProfileData(profile);
        }
      }
    };

    fetchUserCountry();
  }, [currentUser]);

  const handleNewPostMediaChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.match(/^(image\/|video\/|.+\.pdf$)/)) {
        setError(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
        toast.error(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
        toast.error(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
        return;
      }
      setNewPostMedia(selectedFile);
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setMediaPreview(URL.createObjectURL(selectedFile));
      } else {
        setMediaPreview(null);
      }
    }
  };

  const clearNewPostMedia = () => {
    setNewPostMedia(null);
    setMediaPreview(null);
  };

  const handleCreatePost = async () => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна авторизація');
      navigate('/');
      return;
    }
    if (!newPostContent && !newPostMedia) {
      setError(t('emptyPost') || 'Пост не може бути порожнім');
      toast.error(t('emptyPost') || 'Пост не може бути порожнім');
      return;
    }
    try {
      setLoading(true);
      let mediaUrl = null;
      let mediaType = 'text';
      
      if (newPostMedia) {
        const fileExt = newPostMedia.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_${newPostMedia.name}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, newPostMedia);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);
        mediaUrl = publicUrl;
        mediaType = newPostMedia.type.startsWith('image') ? 'image' : 
                   newPostMedia.type.startsWith('video') ? 'video' : 'document';
      }

      const { data, error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: newPostContent,
        media_url: mediaUrl,
        media_type: mediaType,
        country_code: selectedCountry || null,
      }).select(`
        *,
        users(id, username, profile_picture, country),
        reactions(reaction_type, user_id)
      `).single();
      
      if (error) throw error;

      const hashtags = newPostContent.match(/#[^\s#]+/g) || [];
      if (hashtags.length > 0) {
        const hashtagInserts = hashtags.map(tag => ({
          post_id: data.id,
          tag: tag.slice(1).toLowerCase(),
        }));
        const { error: hashtagError } = await supabase.from('post_hashtags').insert(hashtagInserts);
        if (hashtagError) throw hashtagError;
      }

      setNewPostContent('');
      setNewPostMedia(null);
      setMediaPreview(null);
      setShowCreatePostModal(false);
      
      toast.success(t('postCreated') || 'Пост успішно створено');

      window.location.reload();
    } catch (err) {
      console.error('Помилка створення поста:', err);
      setError(t('postError') || 'Помилка створення поста');
      toast.error(t('postError') || 'Помилка створення поста');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert(t('metaMaskNotFound'));
      return;
    }
    try {
      if (!window.ethereum.isMetaMask || !window.ethereum.isConnected()) {
        alert(t('metaMaskNotReady'));
        return;
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setConnected(true);
        alert(t('walletConnected'));
      }
    } catch (error) {
      console.error('Помилка підключення до MetaMask:', error);
      alert(t('walletConnectionError'));
    }
  };

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const getFlagEmoji = (language) => {
    switch (language) {
      case 'uk': return '🇺🇦';
      case 'en': return '🇺🇸';
      default: return '🌐';
    }
  };

  const handleSearchToggle = () => {
    if (window.innerWidth < 768) {
      setIsSearchExpanded(!isSearchExpanded);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo and menu button for mobile */}
            <div className="flex items-center">
              {/* Menu button for mobile */}
              {isMobile && (
                <button 
                  onClick={onToggleSidebar}
                  className="p-2 rounded-full hover:bg-gray-100 mr-2"
                >
                  <FaBars className="h-5 w-5 text-gray-600" />
                </button>
              )}
              
              {/* Logotype */}
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => navigate('/feed')}
              >
                <div className="flex flex-col justify-center">
                  <div className="flex items-center">
                    <div className="bg-accent text-blue-950 p-1.5 sm:p-2 rounded-md font-bold text-sm sm:text-base">
                      <img 
                        src="/logo.png" 
                        alt="HRP Logo" 
                        className="h-6 sm:h-8 w-auto max-w-[80px] object-contain"
                      />
                    </div>
                    <span className="ml-2 text-lg sm:text-xl font-bold text-navy hidden sm:block">
                      HUMAN RIGHTS POLICY DAO
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 text-center sm:ml-12 -mt-1 hidden sm:block">
                    Do no harm to others. Allow no harm to yourself.
                    </span>
                </div>
              </div>
            </div>

            {/* The right part */}
            <div className={`flex items-center space-x-2 sm:space-x-3 ${isSearchExpanded ? 'hidden' : 'flex'}`}>
              {/* Desktop search - doubled version */}
              {!isMobile && (
                <div className="relative w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent focus:border-accent text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              )}

              {/* Search button for mobile */}
              {isMobile && (
                <button 
                  onClick={handleSearchToggle}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                >
                  <FaSearch className="h-5 w-5" />
                </button>
              )}

              {/* Purse */}
              <button
                onClick={handleConnectWallet}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative w-9 h-9 flex items-center justify-center"
                disabled={connected}
                title={connected ? t('walletConnected') : t('connectWallet')}
              >
                <FaWallet size={18} className={connected ? "text-green-500" : "text-gray-600"} />
              </button>

              {/* Language selection - displayed on all screens */}
              <button
                onClick={() => handleLanguageChange(i18n.language === 'uk' ? 'en' : 'uk')}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative w-9 h-9 flex items-center justify-center"
                title={i18n.language === 'uk' ? 'Switch to English' : 'Перейти на українську'}
              >
                <span className="text-lg">{getFlagEmoji(i18n.language)}</span>
              </button>

              {/* User profile - displayed only on mobile devices */}
              {isMobile && (
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center justify-center rounded-full focus:outline-none w-9 h-9"
                >
                  {profileData?.profile_picture ? (
                    <img
                      className="w-9 h-9 rounded-full object-cover"
                      src={profileData.profile_picture}
                      alt="User profile"
                    />
                  ) : (
                    <FaUserCircle size={36} className="text-gray-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Advanced search for mobile */}
      {isSearchExpanded && (
        <div className="fixed inset-0 top-16 bg-white p-3 border-b shadow-md z-30">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-accent focus:border-accent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              onClick={() => setIsSearchExpanded(false)}
              className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-200"
            >
              <FaTimes className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Post creation modal window */}
      <Transition appear show={showCreatePostModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowCreatePostModal(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-navy">
                      {t('createPost')}
                    </Dialog.Title>
                    <button
                      onClick={() => setShowCreatePostModal(false)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <FaTimes className="text-gray-500" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="w-full resize-y border border-gray-300 rounded-md p-2"
                      rows="4"
                      placeholder={t('whatsOnYourMind') || 'Що у вас на думці?'}
                      aria-label={t('createPost')}
                    />
                    
                    {mediaPreview && (
                      <div className="relative">
                        {newPostMedia?.type.startsWith('image/') ? (
                          <img src={mediaPreview} alt="Preview" className="max-w-xs rounded-lg" />
                        ) : newPostMedia?.type.startsWith('video/') ? (
                          <video src={mediaPreview} controls className="max-w-xs rounded-lg" />
                        ) : (
                          <p className="text-gray-500">{newPostMedia?.name}</p>
                        )}
                        <button
                          type="button"
                          onClick={clearNewPostMedia}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                          aria-label={t('removeFile')}
                        >
                          X
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="image/*,video/*,.pdf"
                        onChange={handleNewPostMediaChange}
                        className="hidden"
                        id="new-post-media"
                      />
                      <label
                        htmlFor="new-post-media"
                        className="p-2 bg-gray-500 text-gold rounded-full hover:bg-gray-600 cursor-pointer"
                        aria-label={t('attachFile')}
                      >
                        <FaPaperclip className="h-5 w-5" />
                      </label>
                      
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="border border-gray-300 rounded-md p-2"
                        aria-label={t('country')}
                      >
                        <option value="">{t('noCountry') || 'Без країни'}</option>
                        {countries.map(({ code, name }) => (
                          <option key={code} value={code}>
                            {name[i18n.language] || name.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={handleCreatePost}
                      disabled={loading}
                      className="flex-1 bg-accent text-blue-950 py-2 rounded-md hover:bg-blue-800 disabled:opacity-50"
                    >
                      {loading ? t('posting') : t('post')}
                    </button>
                    <button
                      onClick={() => setShowCreatePostModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default Navbar;