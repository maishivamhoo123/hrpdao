import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { FaEdit, FaInfoCircle, FaUserPlus, FaUserMinus, FaTimes, FaSearch, FaBell, FaEnvelope, FaPlus, FaUserCircle, FaHome, FaComments, FaPaperclip } from 'react-icons/fa';
import { IoMdMegaphone } from 'react-icons/io';
import { BiSolidDonateHeart } from 'react-icons/bi';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';
import SocialFeed from './SocialFeed';
import Sidebar from './Sidebar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';
import countries from '../utils/countries';
import Navbar from './Navbar';
import { ChevronDown } from 'lucide-react';
import CreatePostModal from './CreatePostModal';

function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState({
    username: '',
    profile_picture: '',
    country: '',
    city: '',
    status: '',
    bio: '',
    social_links: { facebook: '', twitter: '', instagram: '', youtube: '', telegram: '' }
  });
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProfile, setEditProfile] = useState({
    username: '',
    profile_picture: null,
    country: '',
    city: '',
    status: '',
    bio: '',
    social_links: { facebook: '', twitter: '', instagram: '', youtube: '', telegram: '' }
  });
  const [freedomRatings, setFreedomRatings] = useState({
    speech_freedom: 1,
    economic_freedom: 1,
    political_freedom: 1,
    human_rights_freedom: 1
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1023);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
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

  const statuses = [
    t('statusNotSelected'),
    t('statusDoctor'),
    t('statusTeacher'),
    t('statusLawyer'),
    t('statusNurse'),
    t('statusEngineer'),
    t('statusProgrammer'),
    t('statusDesigner'),
    t('statusArtist'),
    t('statusMusician'),
    t('statusWriter'),
    t('statusJournalist'),
    t('statusJudge'),
    t('statusPoliceOfficer'),
    t('statusFirefighter'),
    t('statusSoldier'),
    t('statusPilot'),
    t('statusDriver'),
    t('statusChef'),
    t('statusFarmer'),
    t('statusScientist'),
    t('statusResearcher'),
    t('statusArchitect'),
    t('statusBuilder'),
    t('statusMechanic'),
    t('statusElectrician'),
    t('statusPlumber'),
    t('statusAccountant'),
    t('statusEconomist'),
    t('statusManager'),
    t('statusSalesperson'),
    t('statusMarketer'),
    t('statusEntrepreneur'),
    t('statusConsultant'),
    t('statusTranslator'),
    t('statusAthlete'),
    t('statusCoach'),
    t('statusPhotographer'),
    t('statusVideographer'),
    t('statusActor'),
    t('statusDirector'),
    t('statusProducer')
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1023);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error(t('authError'), error);
        setError(t('authError'));
        setLoading(false);
        return;
      }
      if (!user) {
        navigate('/');
        return;
      }
      setCurrentUser(user);
      
      // Fetch user profile to set default country
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Помилка завантаження профілю:', profileError);
        setCurrentUser(user);
      } else {
        setCurrentUser({ ...user, ...userProfile });
        if (userProfile.country) {
          setSelectedCountry(userProfile.country);
        }
      }

      await fetchProfile(userId || user.id);
      await fetchStats(userId || user.id);
      if (userId && userId !== user.id) {
        const { data: followData, error: followError } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single();
        setIsFollowing(!!followData && !followError);
      }

      fetchUnreadNotificationsCount(user.id);
      setLoading(false);
    };

    const fetchProfile = async (fetchUserId) => {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('username, profile_picture, country, city, status, bio, social_links')
          .eq('id', fetchUserId)
          .single();

        if (profileError) throw profileError;

        const profileResult = profileData || {
          username: '',
          profile_picture: '',
          country: '',
          city: '',
          status: '',
          bio: '',
          social_links: { facebook: '', twitter: '', instagram: '', youtube: '', telegram: '' }
        };

        setProfile(profileResult);
        setEditProfile({
          ...profileResult,
          profile_picture: null,
        });

        const { data: ratingsData, error: ratingsError } = await supabase
          .from('freedom_ratings')
          .select('speech_freedom, economic_freedom, political_freedom, human_rights_freedom')
          .eq('user_id', fetchUserId)
          .eq('country_code', profileResult.country || 'ua')
          .single();

        if (ratingsError && ratingsError.code !== 'PGRST116') throw ratingsError;

        if (ratingsData) {
          setFreedomRatings({
            speech_freedom: ratingsData.speech_freedom || 1,
            economic_freedom: ratingsData.economic_freedom || 1,
            political_freedom: ratingsData.political_freedom || 1,
            human_rights_freedom: ratingsData.human_rights_freedom || 1,
          });
        }
      } catch (err) {
        console.error(t('profileError'), err);
        setError(t('profileError'));
      }
    };

    const fetchStats = async (fetchUserId) => {
      try {
        const { count: postCount, error: postError } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', fetchUserId);
        if (postError) throw postError;

        const { count: followerCount, error: followerError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', fetchUserId);
        if (followerError) throw followerError;

        const { count: followingCount, error: followingError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', fetchUserId);
        if (followingError) throw followingError;

        setStats({
          posts: postCount || 0,
          followers: followerCount || 0,
          following: followingCount || 0,
        });
      } catch (err) {
        console.error(t('statsError'), err);
        setError(t('statsError'));
      }
    };

    fetchCurrentUser();
  }, [userId, navigate, t, i18n.language]);

  useEffect(() => {
    setTimeout(() => {
      setupSynchronizedScrolling();
    }, 100);

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

  const getGeolocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${i18n.language}`
            );
            const data = await response.json();
            const countryCode = countries.find(c => c.name[i18n.language] === data.countryName)?.code || '';
            setEditProfile({ ...editProfile, country: countryCode });
            setIsLoading(false);
            toast.success(t('geolocationSuccess'));
          } catch (err) {
            setError(t('geolocationError'));
            setIsLoading(false);
            toast.error(t('geolocationError'));
          }
        },
        (err) => {
          setError(t('geolocationNotSupported'));
          setIsLoading(false);
          toast.error(t('geolocationNotSupported'));
        }
      );
    } else {
      setError(t('geolocationNotSupported'));
      setIsLoading(false);
      toast.error(t('geolocationNotSupported'));
    }
  };

  const fetchUnreadNotificationsCount = async (userId) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false);

      if (!error && count) {
        setUnreadNotifications(count);
      }
    } catch (error) {
      console.error(t('notificationError'), error);
    }
  };

  const markNotificationsAsRead = async () => {
    if (currentUser && unreadNotifications > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      setUnreadNotifications(0);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    const targetUserId = userId || currentUser.id;
    if (currentUser.id === targetUserId) {
      setError(t('cannotFollowSelf'));
      toast.error(t('cannotFollowSelf'));
      return;
    }
    try {
      setLoading(true);
      const { data: existingFollow, error: fetchError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', targetUserId)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (existingFollow) {
        const { error: deleteError } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetUserId);
        if (deleteError) throw deleteError;
        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        const { error: insertError } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: targetUserId,
          });
        if (insertError) throw insertError;
        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (err) {
      console.error(t('followError'), err);
      setError(t('followError'));
      toast.error(t('followError'));
    } finally {
      setLoading(false);
    }
  };

  const updateFreedomRatings = async (updatedRatings) => {
    if (!currentUser) return;
    try {
      const { data: existingRating, error: fetchError } = await supabase
        .from('freedom_ratings')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('country_code', profile.country || 'ua')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const ratingData = {
        user_id: currentUser.id,
        country_code: profile.country || 'ua',
        speech_freedom: updatedRatings.speech_freedom,
        economic_freedom: updatedRatings.economic_freedom,
        political_freedom: updatedRatings.political_freedom,
        human_rights_freedom: updatedRatings.human_rights_freedom,
      };

      if (existingRating) {
        const { error: updateError } = await supabase
          .from('freedom_ratings')
          .update(ratingData)
          .eq('id', existingRating.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('freedom_ratings')
          .insert(ratingData);
        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error(t('ratingError'), err);
      setError(t('ratingError'));
      toast.error(t('ratingError'));
    }
  };

  const handleRatingChange = (key, value) => {
    const updatedRatings = { ...freedomRatings, [key]: parseInt(value, 10) };
    setFreedomRatings(updatedRatings);
    updateFreedomRatings(updatedRatings);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError(t('invalidFileType'));
        toast.error(t('invalidFileType'));
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError(t('fileTooLarge'));
        toast.error(t('fileTooLarge'));
        return;
      }
      setEditProfile({ ...editProfile, profile_picture: selectedFile });
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const clearFile = () => {
    setEditProfile({ ...editProfile, profile_picture: null });
    setFilePreview(null);
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      setError(null);
      let profilePictureUrl = profile.profile_picture;

      if (editProfile.profile_picture) {
        if (!editProfile.profile_picture.type.startsWith('image/')) {
          setError(t('invalidFileType'));
          toast.error(t('invalidFileType'));
          setLoading(false);
          return;
        }
        if (editProfile.profile_picture.size > 5 * 1024 * 1024) {
          setError(t('fileTooLarge'));
          toast.error(t('fileTooLarge'));
          setLoading(false);
          return;
        }

        if (profile.profile_picture) {
          const oldFilePath = profile.profile_picture.split('/profile-pictures/')[1];
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage
              .from('profile-pictures')
              .remove([oldFilePath]);
            if (deleteError) {
              console.error(t('deleteAvatarError'), deleteError);
            }
          }
        }

        const fileExt = editProfile.profile_picture.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_${editProfile.profile_picture.name}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, editProfile.profile_picture);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);
        profilePictureUrl = publicUrlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: editProfile.username,
          profile_picture: profilePictureUrl,
          country: editProfile.country,
          city: editProfile.city,
          status: editProfile.status,
          bio: editProfile.bio,
          social_links: editProfile.social_links,
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile({
        ...editProfile,
        profile_picture: profilePictureUrl,
      });
      setIsEditModalOpen(false);
      setFilePreview(null);
      toast.success(t('profileUpdated'));
    } catch (err) {
      console.error(t('updateError'), err);
      setError(t('updateError'));
      toast.error(t('updateError'));
    } finally {
      setLoading(false);
    }
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

  const countryData = countries.find((c) => c.code === profile.country);
  const countryName = countryData ? countryData.name[i18n.language] || countryData.name['en'] : t('unknown');
  const isOwnProfile = !userId || userId === currentUser?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col">
      <Navbar
        currentUser={currentUser}
        unreadNotifications={unreadNotifications}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        isMobile={isMobile}
        onShowCreateModal={handleCreatePostFromSidebar}
        onShowNotifications={markNotificationsAsRead}
      />

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
                  <FaTimes className="w-5 h-5" />
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
                      {profile.city || t('unknown')}, {countryName}
                    </p>
                    <p className="text-sm text-blue-600 font-medium text-center md:text-left">{profile.status || t('noStatus')}</p>
                  </div>
                  {isOwnProfile ? (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full font-semibold hover:from-blue-700 hover:to-blue-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center text-sm"
                    >
                      <FaEdit className="w-3 h-3 mr-1" />
                      {t('editProfile')}
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 text-sm rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${isFollowing
                        ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                        }`}
                    >
                      {isFollowing ? (
                        <>
                          <FaUserMinus className="w-3 h-3 mr-1" />
                          {t('unfollow')}
                        </>
                      ) : (
                        <>
                          <FaUserPlus className="w-3 h-3 mr-1" />
                          {t('follow')}
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{stats.posts}</div>
                    <div className="text-sm text-gray-600">{t('posts')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{stats.followers}</div>
                    <div className="text-sm text-gray-600">{t('followers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{stats.following}</div>
                    <div className="text-sm text-gray-600">{t('following')}</div>
                  </div>
                </div>

                {profile.bio && (
                  <p className="text-gray-700 mb-4 leading-relaxed text-center md:text-left">{profile.bio}</p>
                )}

                {Object.entries(profile.social_links).some(([_, url]) => url) && (
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
              </div>
            </div>

            {isOwnProfile && (
              <div className="bg-gray-50 p-4 rounded-lg mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{t('freedomRatings')}</h2>
                <div className="space-y-3">
                  {['speech_freedom', 'economic_freedom', 'political_freedom', 'human_rights_freedom'].map((key) => (
                    <div key={key} className="relative group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-gray-900">{t(key)}</span>
                        <span className="text-xs text-gray-600">{freedomRatings[key]}/10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={freedomRatings[key]}
                        onChange={(e) => handleRatingChange(key, e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer"
                        aria-label={t(key)}
                      />
                      <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-white shadow-md p-2 rounded z-10">
                        <FaInfoCircle className="text-blue-600 text-sm inline mr-1" />
                        <span className="text-xs text-gray-600">{t(`${key}Tooltip`)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/95 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-100 backdrop-blur-sm mt-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 text-center md:text-left">
                {isOwnProfile ? t('yourPosts') : t('userPosts')}
              </h2>
              <SocialFeed userId={userId || currentUser?.id} />
            </motion.div>
          </motion.div>
        </div>

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

      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      {t('editProfile')}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('username')}</label>
                      <input
                        type="text"
                        value={editProfile.username}
                        onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('profilePicture')}</label>
                      {filePreview && (
                        <div className="relative mt-2 mb-4">
                          <img
                            src={filePreview}
                            alt={t('preview')}
                            className="w-20 h-20 rounded-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={clearFile}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 text-xs"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <label className="cursor-pointer p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                        <FaPaperclip className="w-5 h-5 text-gray-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('country')}</label>
                      <div className="relative">
                        <select
                          value={editProfile.country}
                          onChange={(e) => setEditProfile({ ...editProfile, country: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-blue-950 text-sm shadow-sm"
                        >
                          <option value="">{t('selectCountry')}</option>
                          {countries.map(({ code, name }) => (
                            <option key={code} value={code}>
                              {name[i18n.language] || name.en}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                      <button
                        onClick={getGeolocation}
                        className="mt-2 w-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                        disabled={isLoading}
                      >
                        {isLoading ? t('loading') : t('useGeolocation')}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('city')}</label>
                      <input
                        type="text"
                        value={editProfile.city}
                        onChange={(e) => setEditProfile({ ...editProfile, city: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('status')}</label>
                      <div className="relative">
                        <select
                          value={editProfile.status}
                          onChange={(e) => setEditProfile({ ...editProfile, status: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-full border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white text-blue-950 text-sm shadow-sm"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('bio')}</label>
                      <textarea
                        value={editProfile.bio}
                        onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[120px]"
                        rows="4"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900">{t('socialLinks')}</label>
                      {['facebook', 'twitter', 'instagram', 'youtube', 'telegram'].map((social) => (
                        <div key={social} className="mt-2">
                          <label className="block text-sm text-gray-600 capitalize">{t(social)}</label>
                          <input
                            type="url"
                            value={editProfile.social_links[social]}
                            onChange={(e) => setEditProfile({
                              ...editProfile,
                              social_links: { ...editProfile.social_links, [social]: e.target.value }
                            })}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={t(`placeholder.${social}`) || `https://${social}.com/username`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 flex gap-3">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={loading}
                      className={`flex-1 px-4 py-3 rounded-full font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-xl ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 hover:from-blue-950 hover:via-blue-900 hover:to-blue-800'}`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {t('saving')}
                        </>
                      ) : (
                        t('saveChanges')
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-full font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 transition-all duration-300 text-sm shadow-md hover:shadow-lg"
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

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Profile;