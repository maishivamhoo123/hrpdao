import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SocialFeed from './SocialFeed';
import countries from '../utils/countries';
import { FaPaperPlane, FaHeart, FaRegHeart, FaShare, FaEllipsisH, FaBars, FaTimes, FaHome, FaComments, FaUserCircle, FaPlus, FaPaperclip } from 'react-icons/fa';
import { BiSolidDonateHeart } from 'react-icons/bi';
import { IoMdMegaphone } from 'react-icons/io';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';
import { ChevronDown } from 'lucide-react';

function PublicProfile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState({
    username: '',
    profile_picture: '',
    country: '',
    city: '',
    status: '',
    bio: '',
    social_links: { facebook: '', twitter: '', instagram: '', youtube: '', telegram: '' }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1023);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');

  const leftColumnRef = useRef(null);
  const centerColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const isScrolling = useRef(false);
  const shareMenuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1023);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchProfileAndUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Помилка отримання користувача:', userError);
          setError(t('authError') || 'Помилка автентифікації');
          setLoading(false);
          return;
        }
        setCurrentUser(user);

        if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          setError(t('invalidUserId') || 'Недійсний ідентифікатор користувача');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('username, profile_picture, country, city, status, bio, social_links')
          .eq('id', userId)
          .single();
        if (error) throw error;
        setProfile(data || {
          username: '',
          profile_picture: '',
          country: '',
          city: '',
          status: '',
          bio: '',
          social_links: { facebook: '', twitter: '', instagram: '', youtube: '', telegram: '' }
        });

        const [followersData, followingData, postsData] = await Promise.all([
          supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', userId),
          supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('follower_id', userId),
          supabase
            .from('posts')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
        ]);

        setFollowersCount(followersData.count || 0);
        setFollowingCount(followingData.count || 0);
        setPostsCount(postsData.count || 0);

        if (user) {
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .maybeSingle();

          if (!followError) {
            setIsFollowing(!!followData);
          }
        }
      } catch (err) {
        console.error('Помилка завантаження профілю:', err);
        setError(t('profileError') || 'Помилка завантаження профілю');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndUser();
  }, [t, userId, i18n.language]);

  useEffect(() => {
    if (!isMobile) {
      setTimeout(() => {
        setupSynchronizedScrolling();
      }, 100);
    }

    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
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
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [loading, isMobile]);

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

  const handleFollowToggle = async () => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна автентифікація');
      navigate('/');
      return;
    }
    if (currentUser.id === userId) {
      setError(t('cannotFollowSelf') || 'Ви не можете слідкувати за собою');
      return;
    }

    try {
      setFollowLoading(true);
      setError(null);

      if (isFollowing) {
        const { error: deleteError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId);

        if (deleteError) throw deleteError;
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        const { error: insertError } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Помилка оновлення підписки:', err);
      setError(t('followError') || 'Помилка оновлення підписки');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна автентифікація');
      navigate('/');
      return;
    }
    if (currentUser.id === userId) {
      setError(t('cannotMessageSelf') || 'Ви не можете надіслати повідомлення собі');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: targetUserChats, error: targetUserError } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', userId);
      if (targetUserError) throw targetUserError;

      const targetChatIds = targetUserChats.map(chat => chat.chat_id);

      const { data: chatMembers, error: chatError } = await supabase
        .from('chat_members')
        .select('chat_id, chats!inner(is_group)')
        .eq('user_id', currentUser.id)
        .in('chat_id', targetChatIds.length ? targetChatIds : ['00000000-0000-0000-0000-000000000000'])
        .eq('chats.is_group', false) 
        .limit(1)
        .maybeSingle();

      if (chatError) throw chatError;

      let chatId;
      if (chatMembers) {
        chatId = chatMembers.chat_id;
      } else {
        const { data: targetUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        if (userError || !targetUser) {
          setError(t('userNotFound') || 'Користувача не знайдено');
          return;
        }

        const { data: newChat, error: createChatError } = await supabase
          .from('chats')
          .insert({ is_group: false, created_by: currentUser.id })
          .select()
          .single();
        if (createChatError) throw createChatError;

        chatId = newChat.id;

        const members = [
          { chat_id: chatId, user_id: currentUser.id },
          { chat_id: chatId, user_id: userId }
        ];
        const { error: memberError } = await supabase.from('chat_members').insert(members);
        if (memberError) throw memberError;
      }

      navigate('/chat', { state: { selectedChatId: chatId } });
    } catch (err) {
      console.error('Помилка створення чату:', err);
      setError(t('createChatError') || 'Помилка створення чату');
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${profile.username} - ${t('profile')}`,
        text: `${t('checkOutProfile')} ${profile.username} ${t('onHumanRightsPlatform')}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      setError(t('linkCopied') || 'Посилання скопійовано в буфер обміну');
      setTimeout(() => setError(null), 2000);
    }
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setError(t('linkCopied') || 'Посилання скопійовано в буфер обміну');
    setTimeout(() => setError(null), 2000);
    setShowShareMenu(false);
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

  const handleNewPostMediaChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.match(/^(image\/|video\/|.+\.pdf$)/)) {
        setError(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
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
        mediaType = newPostMedia.type.startsWith('image') ? 'image' : newPostMedia.type.startsWith('video') ? 'video' : 'document';
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
        reactions(reaction_type, user_id),
        comments(count)
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
      setShowCreateModal(false);
   
      window.location.reload();
    } catch (err) {
      console.error('Помилка створення поста:', err);
      setError(t('postError') || 'Помилка створення поста');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
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
        unreadNotifications={unreadNotifications}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isMobile={isMobile}
        onShowCreateModal={handleCreatePostFromSidebar}
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
              <Sidebar currentUser={currentUser} onShowCreateModal={handleCreatePostFromSidebar} />
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
            <Sidebar currentUser={currentUser} onShowCreateModal={handleCreatePostFromSidebar} />
          </div>
        )}
        
        {/*Central panel - Profile and posts */}
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
            <div className="flex flex-col md:flex-row items-start mb-6">
              <img
                src={profile.profile_picture || 'https://placehold.co/96x96'}
                alt={t('profilePicture')}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mr-0 md:mr-6 mb-4 md:mb-0 object-cover border-4 border-white shadow-md self-center md:self-auto"
              />
              <div className="flex-1 w-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-full">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 text-center md:text-left">{profile.username || t('anonymous')}</h2>
                    <p className="text-sm text-gray-600 mb-2 text-center md:text-left">
                      {profile.city || t('unknown')}, {countries.find(c => c.code === profile.country)?.name[i18n.language] || t('unknown')}
                    </p>
                    <p className="text-sm text-blue-600 font-medium text-center md:text-left">{profile.status || t('noStatus')}</p>
                  </div>
                  <div className="relative hidden md:block" ref={shareMenuRef}>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label={t('share')}
                    >
                      <FaEllipsisH className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50"
                        >
                          <button
                            onClick={handleShareProfile}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <FaShare className="w-4 h-4 text-gray-600" />
                            {t('shareProfile')}
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <FaPaperPlane className="w-4 h-4 text-gray-600" />
                            {t('copyLink')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{postsCount}</div>
                    <div className="text-sm text-gray-600">{t('posts')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{followersCount}</div>
                    <div className="text-sm text-gray-600">{t('followers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{followingCount}</div>
                    <div className="text-sm text-gray-600">{t('following')}</div>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 leading-relaxed text-center md:text-left">{profile.bio || t('noBio')}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                  {currentUser && currentUser.id !== userId && (
                    <>
                      <button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${isFollowing 
                          ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                        }`}
                        aria-label={isFollowing ? t('unfollow') : t('follow')}
                      >
                        {followLoading ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                        ) : isFollowing ? (
                          <FaHeart className="w-3 h-3 mr-1 text-red-500" />
                        ) : (
                          <FaRegHeart className="w-3 h-3 mr-1" />
                        )}
                        {followLoading ? t('loading') : (isFollowing ? t('unfollow') : t('follow'))}
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="flex items-center bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-full font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md hover:shadow-lg"
                        aria-label={t('sendMessage')}
                      >
                        <FaPaperPlane className="w-3 h-3 mr-1" />
                        {t('sendMessage')}
                      </button>
                    </>
                  )}
                </div>
                
                {/* Social links as icons with text */}
                {Object.entries(profile.social_links).some(([_, value]) => value) && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 text-center md:text-left">{t('socialLinks')}</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      {Object.entries(profile.social_links).map(([platform, url]) => (
                        url && (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                          >
                            <img
                              src={`https://unpkg.com/simple-icons@v9/icons/${platform}.svg`}
                              alt={platform}
                              className="w-3 h-3 mr-1"
                            />
                            <span className="truncate max-w-[80px]">{url}</span>
                          </a>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile menu share */}
                <div className="md:hidden mt-4 flex justify-center">
                  <div className="relative" ref={shareMenuRef}>
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center"
                      aria-label={t('share')}
                    >
                      <FaShare className="w-4 h-4 text-gray-600 mr-1" />
                      <span className="text-sm">{t('share')}</span>
                    </button>
                    
                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50"
                        >
                          <button
                            onClick={handleShareProfile}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <FaShare className="w-4 h-4 text-gray-600" />
                            {t('shareProfile')}
                          </button>
                          <button
                            onClick={handleCopyLink}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                          >
                            <FaPaperPlane className="w-4 h-4 text-gray-600" />
                            {t('copyLink')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* User posts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center md:text-left">{t('posts')}</h2>
            <SocialFeed userId={userId} />
          </motion.div>
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

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">{t('createPost')}</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={t('whatsOnYourMind')}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px]"
                  rows="4"
                />
              </div>
              
              {mediaPreview && (
                <div className="mb-4 relative">
                  {newPostMedia?.type?.startsWith('image/') ? (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="w-full h-auto rounded-lg max-h-60 object-contain"
                    />
                  ) : newPostMedia?.type?.startsWith('video/') ? (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="w-full h-auto rounded-lg max-h-60 object-contain"
                    />
                  ) : null}
                  <button
                    onClick={clearNewPostMedia}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <FaPaperclip className="w-5 h-5 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*,video/*,.pdf"
                      onChange={handleNewPostMediaChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-blue-950 text-sm shadow-sm"
                    aria-label={t('complaint.country') || 'Країна'}
                  >
                    <option value="">{t('selectCountry')}</option>
                    {countries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name[i18n.language]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
              
              <button
                onClick={handleCreatePost}
                disabled={loading || (!newPostContent && !newPostMedia)}
                className={`w-full px-4 py-3 rounded-full font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-xl ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-950 hover:via-blue-900 hover:to-blue-800'}`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('publishing')}
                  </>
                ) : (
                  <>
                    {t('publish')}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default PublicProfile;