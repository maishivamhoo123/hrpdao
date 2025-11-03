import React, { useState, useEffect, useRef, Fragment } from 'react';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaUsers, FaLock, FaGlobe, FaEdit, FaTrash, FaSignOutAlt, FaTimes, FaComments, FaHome } from 'react-icons/fa';
import { IoMdMegaphone } from 'react-icons/io';
import { BiSolidDonateHeart } from 'react-icons/bi';
import { Dialog, Transition } from '@headlessui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';
import CreatePostModal from './CreatePostModal';

function Community() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [allCommunities, setAllCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
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
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    category: '',
    cover_image: null,
    privacy: 'public',
    rules: '',
  });
  const [editCommunity, setEditCommunity] = useState({
    id: '',
    name: '',
    description: '',
    category: '',
    cover_image: null,
    privacy: 'public',
    rules: '',
  });
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('my');

  // Refs для колонок
  const leftColumnRef = useRef(null);
  const centerColumnRef = useRef(null);
  const rightColumnRef = useRef(null);
  const isScrolling = useRef(false);

  const categories = [
    'Права людини',
    'Екологія',
    'Освіта',
    'Технології',
    'Здоров\'я',
    'Культура',
    'Інше',
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
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('country')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          setCurrentUser(user);
        } else {
          setCurrentUser({ ...user, ...userProfile });
          if (userProfile.country) {
            setSelectedCountry(userProfile.country);
          }
        }
        return user;
      } catch (err) {
        setError(t('authError'));
        setLoading(false);
        return null;
      }
    };

    const initializeData = async () => {
      const user = await fetchCurrentUser();
      if (user) {
        await Promise.all([fetchMyCommunities(user), fetchAllCommunities()]);
      }
      setLoading(false);
    };

    initializeData();
  }, [t]);

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

  const fetchMyCommunities = async (user = currentUser) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*, community_members!inner(user_id, role), community_members_aggregate:community_members!community_id(count)')
        .eq('community_members.user_id', user.id)
        .eq('community_members.status', 'approved');
      
      if (error) throw error;
      
      setCommunities(data.map(community => ({
        ...community,
        member_count: community.community_members_aggregate[0]?.count || 0,
      })) || []);
    } catch (err) {
      console.error('Error fetching my communities:', err);
      setError(t('fetchCommunitiesError'));
    }
  };

  const fetchAllCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*, community_members_aggregate:community_members!community_id(count)')
        .eq('privacy', 'public');
      
      if (error) throw error;
      
      setAllCommunities(data.map(community => ({
        ...community,
        member_count: community.community_members_aggregate[0]?.count || 0,
      })) || []);
    } catch (err) {
      console.error('Error fetching all communities:', err);
    }
  };

  const handleCreateCommunity = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!newCommunity.name || !newCommunity.description || !newCommunity.category) {
      setError(t('fillRequiredFields'));
      return;
    }

    try {
      setLoading(true);
      let coverImageUrl = '';
      if (newCommunity.cover_image) {
        const fileName = `${currentUser.id}/${Date.now()}_${newCommunity.cover_image.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('community-covers')
          .upload(fileName, newCommunity.cover_image);
        if (uploadError) throw uploadError;
        coverImageUrl = supabase.storage.from('community-covers').getPublicUrl(fileName).data.publicUrl;
      }

      const { data: community, error: insertError } = await supabase
        .from('communities')
        .insert({
          name: newCommunity.name,
          description: newCommunity.description,
          category: newCommunity.category,
          cover_image: coverImageUrl,
          privacy: newCommunity.privacy,
          creator_id: currentUser.id,
          rules: newCommunity.rules,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          user_id: currentUser.id,
          role: 'admin',
          status: 'approved',
        });

      await Promise.all([fetchMyCommunities(), fetchAllCommunities()]);
      
      setIsCreateModalOpen(false);
      setNewCommunity({ name: '', description: '', category: '', cover_image: null, privacy: 'public', rules: '' });
      setFilePreview(null);
      toast.success(t('communityCreated'));
    } catch (err) {
      setError(t('createCommunityError') + ': ' + err.message);
      console.error('Create community error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCommunity = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!editCommunity.name || !editCommunity.description || !editCommunity.category) {
      setError(t('fillRequiredFields'));
      return;
    }

    try {
      setLoading(true);
      let coverImageUrl = editCommunity.cover_image;
      if (editCommunity.cover_image && typeof editCommunity.cover_image !== 'string') {
        const fileName = `${currentUser.id}/${Date.now()}_${editCommunity.cover_image.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from('community-covers')
          .upload(fileName, editCommunity.cover_image);
        if (uploadError) throw uploadError;
        coverImageUrl = supabase.storage.from('community-covers').getPublicUrl(fileName).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from('communities')
        .update({
          name: editCommunity.name,
          description: editCommunity.description,
          category: editCommunity.category,
          cover_image: coverImageUrl,
          privacy: editCommunity.privacy,
          rules: editCommunity.rules,
        })
        .eq('id', editCommunity.id)
        .eq('creator_id', currentUser.id);
      if (updateError) throw updateError;

      await Promise.all([fetchMyCommunities(), fetchAllCommunities()]);
      
      setIsEditModalOpen(false);
      setEditCommunity({ id: '', name: '', description: '', category: '', cover_image: null, privacy: 'public', rules: '' });
      setFilePreview(null);
      toast.success(t('communityUpdated'));
    } catch (err) {
      setError(t('updateCommunityError') + ': ' + err.message);
      console.error('Update community error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!confirm(t('confirmDeleteCommunity'))) return;

    try {
      setLoading(true);
      
      const { error: membersError } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId);
      
      if (membersError) throw membersError;

      const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)
        .eq('creator_id', currentUser.id);
      
      if (error) throw error;

      await Promise.all([fetchMyCommunities(), fetchAllCommunities()]);
      toast.success(t('communityDeleted'));
    } catch (err) {
      setError(t('deleteCommunityError') + ': ' + err.message);
      console.error('Delete community error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!confirm(t('confirmLeaveCommunity'))) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', currentUser.id);
      
      if (error) throw error;

      await Promise.all([fetchMyCommunities(), fetchAllCommunities()]);
      toast.success(t('leftCommunity'));
    } catch (err) {
      setError(t('leaveCommunityError') + ': ' + err.message);
      console.error('Leave community error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (isEdit) {
        setEditCommunity({ ...editCommunity, cover_image: file });
      } else {
        setNewCommunity({ ...newCommunity, cover_image: file });
      }
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleJoinCommunity = async (communityId) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    try {
      setLoading(true);
      const { data: community, error: fetchError } = await supabase
        .from('communities')
        .select('privacy')
        .eq('id', communityId)
        .single();
      if (fetchError) throw fetchError;

      const { data: existingMember, error: memberError } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', currentUser.id)
        .single();
      
      if (memberError && memberError.code !== 'PGRST116') throw memberError;
      if (existingMember) {
        toast.info(t('alreadyMember'));
        return;
      }

      const status = community.privacy === 'public' ? 'approved' : 'pending';
      const { error: insertError } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: currentUser.id,
          role: 'member',
          status,
        });
      if (insertError) throw insertError;

      await Promise.all([fetchMyCommunities(), fetchAllCommunities()]);

      if (status === 'approved') {
        toast.success(t('joinedCommunity'));
      } else {
        toast.info(t('joinRequestSent'));
      }
    } catch (err) {
      setError(t('joinCommunityError') + ': ' + err.message);
      console.error('Join community error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select('*, community_members_aggregate:community_members!community_id(count)')
        .ilike('name', `%${searchQuery}%`)
        .eq('privacy', 'public');
      
      if (error) throw error;
      
      setAllCommunities(data.map(community => ({
        ...community,
        member_count: community.community_members_aggregate[0]?.count || 0,
      })) || []);
      
      setViewMode('search');
    } catch (err) {
      setError(t('searchCommunitiesError') + ': ' + err.message);
      console.error('Search communities error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isUserMember = (communityId) => {
    return communities.some(c => c.id === communityId);
  };

  const displayedCommunities = viewMode === 'my' ? communities : 
                              viewMode === 'search' ? allCommunities.filter(c => 
                                c.name.toLowerCase().includes(searchQuery.toLowerCase())) : 
                              allCommunities;

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
    </div>
  );

  if (error) return (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col">
      <Navbar 
        currentUser={currentUser} 
        onShowCreateModal={handleCreatePostFromSidebar}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        onToggleSearch={() => setIsSearchVisible(!isSearchVisible)}
        isMobile={isMobile}
      />
      
      {isSearchVisible && (
        <div className="lg:hidden bg-white p-3 border-b">
          <div className="flex items-center">
            <input
              type="text"
              placeholder={t('searchCommunities')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
            <button 
              onClick={handleSearch}
              className="bg-blue-700 text-white px-4 py-2 rounded-r-lg"
            >
              <FaSearch />
            </button>
          </div>
        </div>
      )}
      
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
            <div className="mb-6 flex items-center gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchCommunities')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  aria-label={t('searchCommunities')}
                />
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                aria-label={t('createCommunity')}
              >
                <FaPlus className="text-sm" />
                <span className="hidden sm:inline">{t('create')}</span>
              </button>
            </div>

            <div className="mb-6 flex gap-1 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setViewMode('my')}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'my' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-600 hover:text-blue-950'
                }`}
              >
                {t('myCommunities')}
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  viewMode === 'all' ? 'bg-white text-blue-950 shadow-sm' : 'text-gray-600 hover:text-blue-950'
                }`}
              >
                {t('allCommunities')}
              </button>
            </div>

            <div className="space-y-4">
              {displayedCommunities.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {viewMode === 'my' ? t('noCommunities') : t('noCommunitiesFound')}
                </div>
              ) : (
                displayedCommunities.map((community) => (
                  <div key={community.id} className="bg-white/95 p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-lg transition-all backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1 gap-4">
                        {community.cover_image && (
                          <img 
                            src={community.cover_image} 
                            alt={community.name} 
                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0" 
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="text-lg font-semibold text-blue-950 cursor-pointer hover:text-blue-800 transition-colors mb-2"
                            onClick={() => navigate(`/community/${community.id}`)}
                          >
                            {community.name}
                          </h3>
                          <p className="text-sm text-blue-800 mb-3 line-clamp-2">{community.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full">{community.category}</span>
                            <span className="flex items-center gap-1 text-blue-700">
                              {community.privacy === 'public' ? 
                                <FaGlobe className="inline" /> : 
                                <FaLock className="inline" />
                              }
                              {t(community.privacy)}
                            </span>
                            <span className="flex items-center gap-1 text-blue-700">
                              <FaUsers className="inline" />
                              {community.member_count || 0} {t('members')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => navigate(`/community/${community.id}`)}
                          className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors shadow-sm"
                        >
                          {t('viewCommunity')}
                        </button>
                        
                        {community.creator_id === currentUser?.id && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setEditCommunity(community);
                                setFilePreview(community.cover_image);
                                setIsEditModalOpen(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors shadow-sm"
                              aria-label={t('editCommunity')}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleDeleteCommunity(community.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors shadow-sm"
                              aria-label={t('deleteCommunity')}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                        
                        {isUserMember(community.id) ? (
                          <button
                            onClick={() => handleLeaveCommunity(community.id)}
                            className="px-4 py-2 text-red-600 text-sm hover:bg-red-50 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                            title={t('leaveCommunity')}
                          >
                            <FaSignOutAlt />
                            {t('leave')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinCommunity(community.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white text-sm rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
                          >
                            {t('joinCommunity')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
              <FaPlus className="w-5 h-5 mb-1" />
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

      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 p-6 text-left align-middle shadow-xl transition-all backdrop-blur-sm border border-blue-100">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-blue-950 mb-4">
                    {t('createCommunity')}
                  </Dialog.Title>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('communityName')} *</label>
                      <input
                        type="text"
                        value={newCommunity.name}
                        onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        aria-label={t('communityName')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('description')} *</label>
                      <textarea
                        value={newCommunity.description}
                        onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                        className="w-full resize-y px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        rows="3"
                        aria-label={t('description')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('category')} *</label>
                      <select
                        value={newCommunity.category}
                        onChange={(e) => setNewCommunity({ ...newCommunity, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        aria-label={t('category')}
                        required
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('coverImage')}</label>
                      {filePreview && (
                        <div className="relative mb-2">
                          <img src={filePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                          <button
                            onClick={() => {
                              setNewCommunity({ ...newCommunity, cover_image: null });
                              setFilePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-700"
                            aria-label={t('removeFile')}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e)}
                        className="w-full text-blue-800 mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
                        aria-label={t('coverImage')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('privacy')}</label>
                      <select
                        value={newCommunity.privacy}
                        onChange={(e) => setNewCommunity({ ...newCommunity, privacy: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        aria-label={t('privacy')}
                      >
                        <option value="public">{t('public')}</option>
                        <option value="private">{t('private')}</option>
                        <option value="secret">{t('secret')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('rules')}</label>
                      <textarea
                        value={newCommunity.rules}
                        onChange={(e) => setNewCommunity({ ...newCommunity, rules: e.target.value })}
                        className="w-full resize-y px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        rows="3"
                        aria-label={t('rules')}
                        placeholder={t('rulesPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 text-blue-800 bg-white border border-blue-200 rounded-full hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
                      onClick={handleCreateCommunity}
                      disabled={loading}
                    >
                      {loading ? t('creating') : t('create')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/95 p-6 text-left align-middle shadow-xl transition-all backdrop-blur-sm border border-blue-100">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-blue-950 mb-4">
                    {t('editCommunity')}
                  </Dialog.Title>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('communityName')} *</label>
                      <input
                        type="text"
                        value={editCommunity.name}
                        onChange={(e) => setEditCommunity({ ...editCommunity, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        aria-label={t('communityName')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('description')} *</label>
                      <textarea
                        value={editCommunity.description}
                        onChange={(e) => setEditCommunity({ ...editCommunity, description: e.target.value })}
                        className="w-full resize-y px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        rows="3"
                        aria-label={t('description')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('category')} *</label>
                      <select
                        value={editCommunity.category}
                        onChange={(e) => setEditCommunity({ ...editCommunity, category: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        aria-label={t('category')}
                        required
                      >
                        <option value="">{t('selectCategory')}</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('coverImage')}</label>
                      {filePreview && (
                        <div className="relative mb-2">
                          <img src={filePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                          <button
                            onClick={() => {
                              setEditCommunity({ ...editCommunity, cover_image: null });
                              setFilePreview(null);
                            }}
                            className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-700"
                            aria-label={t('removeFile')}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, true)}
                        className="w-full text-blue-800 mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200"
                        aria-label={t('coverImage')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('privacy')}</label>
                      <select
                        value={editCommunity.privacy}
                        onChange={(e) => setEditCommunity({ ...editCommunity, privacy: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        aria-label={t('privacy')}
                      >
                        <option value="public">{t('public')}</option>
                        <option value="private">{t('private')}</option>
                        <option value="secret">{t('secret')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-950 mb-1">{t('rules')}</label>
                      <textarea
                        value={editCommunity.rules}
                        onChange={(e) => setEditCommunity({ ...editCommunity, rules: e.target.value })}
                        className="w-full resize-y px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        rows="3"
                        aria-label={t('rules')}
                        placeholder={t('rulesPlaceholder')}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      className="px-4 py-2 text-blue-800 bg-white border border-blue-200 rounded-full hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg"
                      onClick={handleEditCommunity}
                      disabled={loading}
                    >
                      {loading ? t('updating') : t('update')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

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

      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default Community;