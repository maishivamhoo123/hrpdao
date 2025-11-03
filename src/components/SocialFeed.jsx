import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { CheckCircle, XCircle, Eye, MessageSquare, Share, Bookmark, Trash2, Edit, UserPlus, UserMinus, Paperclip, Trophy, Repeat } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import countries from '../utils/countries';

function SocialFeed({ userId, countryCode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [editPostId, setEditPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostMedia, setEditPostMedia] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followStatus, setFollowStatus] = useState({});
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const loadingRef = useRef(false);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const postTime = new Date(date);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) return t('justNow') || 'Щойно';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return t('minutesAgo', { count: diffInMinutes }) || `${diffInMinutes} хвилин тому`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('hoursAgo', { count: diffInHours }) || `${diffInHours} годин тому`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return t('daysAgo', { count: diffInDays }) || `${diffInDays} днів тому`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return t('monthsAgo', { count: diffInMonths }) || `${diffInMonths} місяців тому`;
    const diffInYears = Math.floor(diffInMonths / 12);
    return t('yearsAgo', { count: diffInYears }) || `${diffInYears} років тому`;
  };

  useEffect(() => {
    if (location.state?.showPostForm) {
      setShowPostForm(true);
    }

    const fetchCurrentUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Помилка отримання користувача:', error);
        setError(t('authError') || 'Помилка авторизації');
        setLoading(false);
        return;
      }
      setCurrentUser(user);
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('country')
          .eq('id', user.id)
          .single();
        if (!profileError && profile?.country) {
          setSelectedCountry(profile.country);
        }
      }
    };

    fetchCurrentUser();
    fetchPosts(true);
  }, [t, userId, countryCode, location.state]);

  const fetchCommentsCount = async (postId) => {
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);
      
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Помилка підрахунку коментарів:', err);
      return 0;
    }
  };

  const updateAllPostsCommentsCount = async () => {
    try {
      const updatedPosts = await Promise.all(
        posts.map(async (post) => {
          const commentsCount = await fetchCommentsCount(post.id);
          return {
            ...post,
            comments_count: commentsCount
          };
        })
      );
      setPosts(updatedPosts);
    } catch (err) {
      console.error('Помилка оновлення кількості коментарів:', err);
    }
  };

  const updatePostCommentsCount = async (postId) => {
    try {
      const commentsCount = await fetchCommentsCount(postId);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, comments_count: commentsCount }
            : post
        )
      );
    } catch (err) {
      console.error('Помилка оновлення кількості коментарів:', err);
    }
  };

  useEffect(() => {
    if (posts.length > 0) {
      updateAllPostsCommentsCount();
    }
  }, [posts.length]);

  const fetchPosts = async (reset = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const postsPerPage = 10;

      const query = supabase
        .from('posts')
        .select(`
          *,
          users(id, username, profile_picture, country),
          reactions(reaction_type, user_id)
        `)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * postsPerPage, currentPage * postsPerPage - 1);

      if (userId) query.eq('user_id', userId);
      if (countryCode) query.eq('country_code', countryCode);

      const { data, error } = await query;
      if (error) throw error;

      const postsWithCommentsCount = await Promise.all(
        (data || []).map(async (post) => {
          const commentsCount = await fetchCommentsCount(post.id);
          return {
            ...post,
            comments_count: commentsCount
          };
        })
      );

      if (reset) {
        setPosts(postsWithCommentsCount || []);
        setPage(2);
      } else {
        setPosts(prevPosts => [...prevPosts, ...(postsWithCommentsCount || [])]);
        setPage(prevPage => prevPage + 1);
      }

      setHasMore(data?.length === postsPerPage);

      if (currentUser && data) {
        const userIds = [...new Set(data.map(post => post.user_id))].filter(id => id !== currentUser.id);
        let followStatusMap = {};
        if (userIds.length > 0) {
          const { data: followData, error: followError } = await supabase
            .from('follows')
            .select('follower_id, following_id')
            .eq('follower_id', currentUser.id)
            .in('following_id', userIds);
          if (followError) {
            console.error('Помилка пакетної перевірки підписки:', followError);
          }
          followStatusMap = userIds.reduce((acc, userId) => ({
            ...acc,
            [userId]: followData?.some(f => f.following_id === userId) || false
          }), {});
        }
        if (currentUser.id) {
          followStatusMap[currentUser.id] = false;
        }
        setFollowStatus(prev => ({ ...prev, ...followStatusMap }));
      }
    } catch (err) {
      console.error('Помилка завантаження постів:', err);
      setError(t('unexpectedError') || err.message);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Infinite scroll observer
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

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

  const handleEditPostMediaChange = (e) => {
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
      setEditPostMedia(selectedFile);
      if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
        setEditMediaPreview(URL.createObjectURL(selectedFile));
      } else {
        setEditMediaPreview(null);
      }
    }
  };

  const clearEditPostMedia = () => {
    setEditPostMedia(null);
    setEditMediaPreview(null);
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
        if (!newPostMedia.type.match(/^(image\/|video\/|.+\.pdf$)/)) {
          setError(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
          toast.error(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
          setLoading(false);
          return;
        }
        if (newPostMedia.size > 10 * 1024 * 1024) {
          setError(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
          toast.error(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
          setLoading(false);
          return;
        }
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
        reactions(reaction_type, user_id)
      `).single();
      
      if (error) throw error;

      const postWithComments = {
        ...data,
        comments_count: 0
      };

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
      setSelectedCountry(currentUser.country || '');
      setShowPostForm(false);

      setPosts(prevPosts => [postWithComments, ...prevPosts]);
      toast.success(t('postCreated') || 'Пост успішно створено');
    } catch (err) {
      console.error('Помилка створення поста:', err);
      setError(t('postError') || 'Помилка створення поста');
      toast.error(t('postError') || 'Помилка створення поста');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = (postId, content, mediaUrl, countryCode) => {
    setEditPostId(postId);
    setEditPostContent(content);
    setEditPostMedia(null);
    setEditMediaPreview(mediaUrl || null);
    setSelectedCountry(countryCode || null);
    setIsEditModalOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна авторизація');
      navigate('/');
      return;
    }
    if (!editPostContent && !editPostMedia && !editMediaPreview) {
      setError(t('emptyPost') || 'Пост не може бути порожнім');
      toast.error(t('emptyPost') || 'Пост не може бути порожнім');
      return;
    }
    try {
      setLoading(true);
      let mediaUrl = editMediaPreview;
      let mediaType = posts.find(p => p.id === editPostId)?.media_type || 'text';

      if (editPostMedia) {
        if (!editPostMedia.type.match(/^(image\/|video\/|.+\.pdf$)/)) {
          setError(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
          toast.error(t('invalidFileType') || 'Дозволені формати: зображення, відео, PDF');
          setLoading(false);
          return;
        }
        if (editPostMedia.size > 10 * 1024 * 1024) {
          setError(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
          toast.error(t('fileTooLarge') || 'Файл занадто великий (максимум 10MB)');
          setLoading(false);
          return;
        }
        const currentPost = posts.find(p => p.id === editPostId);
        if (currentPost?.media_url) {
          const oldFilePath = currentPost.media_url.split('/media/')[1];
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage
              .from('media')
              .remove([oldFilePath]);
            if (deleteError) {
              console.error('Помилка видалення попереднього медіа:', deleteError);
            }
          }
        }
        const fileExt = editPostMedia.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}_${editPostMedia.name}`;
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, editPostMedia);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);
        mediaUrl = publicUrl;
        mediaType = editPostMedia.type.startsWith('image') ? 'image' : editPostMedia.type.startsWith('video') ? 'video' : 'document';
      } else if (!editPostMedia && !editMediaPreview) {
        const currentPost = posts.find(p => p.id === editPostId);
        if (currentPost?.media_url) {
          const oldFilePath = currentPost.media_url.split('/media/')[1];
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage
              .from('media')
              .remove([oldFilePath]);
            if (deleteError) {
              console.error('Помилка видалення попереднього медіа:', deleteError);
            }
          }
        }
        mediaUrl = null;
        mediaType = 'text';
      }

      const { error } = await supabase
        .from('posts')
        .update({
          content: editPostContent,
          media_url: mediaUrl,
          media_type: mediaType,
          country_code: selectedCountry || null,
        })
        .eq('id', editPostId);
      if (error) throw error;

      const hashtags = editPostContent.match(/#[^\s#]+/g) || [];
      const { error: deleteHashtagError } = await supabase
        .from('post_hashtags')
        .delete()
        .eq('post_id', editPostId);
      if (deleteHashtagError) throw deleteHashtagError;

      if (hashtags.length > 0) {
        const hashtagInserts = hashtags.map(tag => ({
          post_id: editPostId,
          tag: tag.slice(1).toLowerCase(),
        }));
        const { error: hashtagError } = await supabase.from('post_hashtags').insert(hashtagInserts);
        if (hashtagError) throw hashtagError;
      }

      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === editPostId 
            ? { 
                ...post, 
                content: editPostContent, 
                media_url: mediaUrl, 
                media_type: mediaType,
                country_code: selectedCountry || null
              }
            : post
        )
      );

      setEditPostId(null);
      setEditPostContent('');
      setEditPostMedia(null);
      setEditMediaPreview(null);
      setIsEditModalOpen(false);
      toast.success(t('postUpdated') || 'Пост успішно оновлено');
    } catch (err) {
      console.error('Помилка редагування поста:', err);
      setError(t('postError') || 'Помилка редагування поста');
      toast.error(t('postError') || 'Помилка редагування поста');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна авторизація');
      navigate('/');
      return;
    }
    try {
      setLoading(true);
      const currentPost = posts.find(p => p.id === postId);
      if (currentPost?.media_url) {
        const filePath = currentPost.media_url.split('/media/')[1];
        if (filePath) {
          const { error: deleteError } = await supabase.storage
            .from('media')
            .remove([filePath]);
          if (deleteError) {
            console.error('Помилка видалення медіа:', deleteError);
          }
        }
      }
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      toast.success(t('postDeleted') || 'Пост успішно видалено');
    } catch (err) {
      console.error('Помилка видалення поста:', err);
      setError(t('postError') || 'Помилка видалення поста');
      toast.error(t('postError') || 'Помилка видалення поста');
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна авторизація');
      navigate('/');
      return;
    }
    try {
      const currentReaction = posts.find(p => p.id === postId)?.reactions?.find(r => r.user_id === currentUser.id);
      if (currentReaction && currentReaction.reaction_type === reactionType) {
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        if (error) throw error;
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { ...post, reactions: post.reactions.filter(r => r.user_id !== currentUser.id) }
            : post
        ));
      } else {
        if (currentReaction) {
          const { error } = await supabase
            .from('reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', currentUser.id);
          if (error) throw error;
        }
        const { error: insertError } = await supabase
          .from('reactions')
          .insert({ post_id: postId, user_id: currentUser.id, reaction_type: reactionType });
        if (insertError) throw insertError;
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                reactions: [
                  ...(post.reactions.filter(r => r.user_id !== currentUser.id)), 
                  { user_id: currentUser.id, reaction_type: reactionType }
                ]
              }
            : post
        ));
      }
    } catch (err) {
      console.error('Помилка обробки реакції:', err);
      setError(t('reactionError') || 'Помилка обробки реакції');
      toast.error(t('reactionError') || 'Помилка обробки реакції');
    }
  };

  const handleShare = async (postId) => {
    const postUrl = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success(t('linkCopied') || 'Посилання скопійовано');
    } catch (err) {
      console.error('Помилка копіювання посилання:', err);
      toast.error(t('copyError') || 'Помилка копіювання посилання');
    }
  };

  const handleRepost = async (postId) => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна авторизація');
      navigate('/');
      return;
    }
    try {
      setLoading(true);
      const originalPost = posts.find(p => p.id === postId);
      const { data, error } = await supabase.from('posts').insert({
        user_id: currentUser.id,
        content: `Репост: ${originalPost.content}`,
        media_url: originalPost.media_url,
        media_type: originalPost.media_type,
        country_code: selectedCountry || null,
        original_post_id: postId
      }).select(`
        *,
        users(id, username, profile_picture, country),
        reactions(reaction_type, user_id)
      `).single();
      
      if (error) throw error;

      const postWithComments = {
        ...data,
        comments_count: 0
      };

      setPosts(prevPosts => [postWithComments, ...prevPosts]);
      toast.success(t('postReposted') || 'Пост успішно репостнуто');
    } catch (err) {
      console.error('Помилка репосту:', err);
      setError(t('repostError') || 'Помилка репосту');
      toast.error(t('repostError') || 'Помилка репосту');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (followingId) => {
    if (!currentUser) {
      setError(t('authRequired') || 'Потрібна авторизація');
      navigate('/');
      return;
    }
    try {
      if (followStatus[followingId]) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', followingId);
        if (error) throw error;
        setFollowStatus({ ...followStatus, [followingId]: false });
        toast.success(t('unfollowed') || 'Відписано');
      } else {
        const { error: insertError } = await supabase
          .from('follows')
          .insert({ follower_id: currentUser.id, following_id: followingId });
        if (insertError) throw insertError;
        setFollowStatus({ ...followStatus, [followingId]: true });
        toast.success(t('followed') || 'Підписано');
      }
    } catch (err) {
      console.error('Помилка підписки:', err);
      setError(t('followError') || 'Помилка підписки');
      toast.error(t('followError') || 'Помилка підписки');
    }
  };

  const navigateToComments = useCallback((post) => {
    navigate(`/comments/${post.id}`, { state: { post } });
  }, [navigate]);

  const renderPostContent = (content) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hashtagRegex = /#[^\s#]+/g;
    const parts = content.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part.split(hashtagRegex).map((subPart, subIndex) => {
        if (hashtagRegex.test(subPart)) {
          return (
            <Link
              key={`${index}-${subIndex}`}
              to={`/hashtag/${subPart.slice(1)}`}
              className="text-blue-500 hover:underline"
            >
              {subPart}
            </Link>
          );
        }
        return subPart;
      });
    });
    return <span>{parts}</span>;
  };

  if (loading && posts.length === 0) return <div className="p-4 text-gray-900">{t('loading') || 'Завантаження...'}</div>;
  if (error) return <div className="p-4 text-red-500">{t('error') || 'Помилка'}: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100 flex flex-col">
      <div className="w-full">
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">{t('noPosts') || 'Пости відсутні'}</div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div 
                key={post.id} 
                ref={index === posts.length - 1 ? lastPostElementRef : null}
                className="bg-white p-4 rounded-lg shadow-md relative"
              >
                {currentUser?.id === post.user_id && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleEditPost(post.id, post.content, post.media_url, post.country_code)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                      aria-label={t('editPost') || 'Редагувати пост'}
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
                      aria-label={t('deletePost') || 'Видалити пост'}
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                )}
                <div className="flex items-center mb-2">
                  <img
                    src={post.users?.profile_picture || 'https://placehold.co/40x40'}
                    alt={t('profilePicture') || 'Фото профілю'}
                    className="w-10 h-10 rounded-full mr-2"
                  />
                  <div>
                    <div className="flex items-center">
                      <Link
                        to={`/public/${post.users?.id}`}
                        className="font-bold text-blue-600 hover:underline"
                      >
                        {post.users?.username || t('anonymous') || 'Анонім'}
                      </Link>
                      {currentUser?.id !== post.user_id && (
                        <button
                          onClick={() => handleFollow(post.user_id)}
                          className={`ml-2 flex items-center text-xs transition-colors ${
                            followStatus[post.user_id] ? 'text-gray-500 hover:text-gray-600' : 'text-blue-500 hover:text-blue-600'
                          }`}
                          aria-label={followStatus[post.user_id] ? t('unfollow') || 'Відписатися' : t('follow') || 'Підписатися'}
                        >
                          {followStatus[post.user_id] ? (
                            <>
                              <UserMinus className="h-3 w-3 mr-1" /> {t('unfollow') || 'Відписатися'}
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" /> {t('follow') || 'Підписатися'}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {post.users?.country 
                        ? countries.find(c => c.code === post.users.country)?.name[i18n.language] || t('unknown') || 'Невідомо'
                        : t('unknown') || 'Невідомо'} • {formatTimeAgo(post.created_at)}
                    </p>
                  </div>
                </div>
                <div 
                  className="mb-2 cursor-pointer"
                  onClick={() => navigateToComments(post)}
                >
                  {renderPostContent(post.content)}
                </div>
                {post.media_url && (
                  <div className="mb-2">
                    {post.media_type === 'image' && (
                      <img
                        src={post.media_url}
                        alt={t('postImage') || 'Зображення поста'}
                        className="max-w-xs rounded-lg"
                      />
                    )}
                    {post.media_type === 'video' && (
                      <video
                        src={post.media_url}
                        controls
                        className="max-w-xs rounded-lg"
                      />
                    )}
                    {post.media_type === 'document' && (
                      <a
                        href={post.media_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {t('viewDocument') || 'Переглянути документ'}
                      </a>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap justify-between items-center mt-4">
                  {/* Left side - reactions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleReaction(post.id, 'true')}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        post.reactions?.some(r => r.user_id === currentUser?.id && r.reaction_type === 'true')
                          ? 'text-green-700 bg-green-100 font-semibold'
                          : 'text-green-600 hover:bg-green-100 '
                      }`}
                      aria-label={t('true') || 'Правда'}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('true')} {post.reactions?.filter(r => r.reaction_type === 'true').length || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => handleReaction(post.id, 'false')}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        post.reactions?.some(r => r.user_id === currentUser?.id && r.reaction_type === 'false')
                          ? 'text-red-700 bg-red-100 font-semibold'
                          : 'text-red-600 hover:bg-red-100 '
                      }`}
                      aria-label={t('false') || 'Неправда'}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('false')} {post.reactions?.filter(r => r.reaction_type === 'false').length || 0}
                      </span>
                    </button>
                    <button
                      onClick={() => handleReaction(post.id, 'top')}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                        post.reactions?.some(r => r.user_id === currentUser?.id && r.reaction_type === 'top')
                          ? 'text-yellow-700 bg-yellow-100 font-semibold'
                          : 'text-yellow-600 hover:bg-yellow-100 '
                      }`}
                      aria-label={t('top') || 'Топ'}
                    >
                      <Trophy className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {t('top')} {post.reactions?.filter(r => r.reaction_type === 'top').length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Right side - other actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => navigateToComments(post)}
                      className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label={t('viewComments') || 'Переглянути коментарі'}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs font-medium">{post.comments_count || 0}</span>
                    </button>
                    <button
                      onClick={() => handleShare(post.id)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label={t('share') || 'Поширити'}
                    >
                      <Share className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRepost(post.id)}
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      aria-label={t('repost') || 'Репост'}
                    >
                      <Repeat className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {loading && <div className="text-center text-gray-500 py-4">{t('loading') || 'Завантаження...'}</div>}
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
      
      {/* Modal window for editing a post */}
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {t('editPost') || 'Редагувати пост'}
                  </Dialog.Title>
                  <div className="mt-4">
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      placeholder={t('whatsHappening') || 'Що відбувається?'}
                      className="w-full p-2 border rounded-md resize-none"
                      rows="4"
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('country') || 'Країна'}
                      </label>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="">{t('selectCountry') || 'Виберіть країну'}</option>
                        {countries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name[i18n.language] || country.name.en}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('media') || 'Медіа'}
                      </label>
                      {editMediaPreview && (
                        <div className="relative mb-2">
                          {editMediaPreview.startsWith('blob:') ? (
                            editPostMedia?.type?.startsWith('image/') ? (
                              <img
                                src={editMediaPreview}
                                alt={t('mediaPreview') || 'Попередній перегляд'}
                                className="max-w-xs rounded-lg"
                              />
                            ) : editPostMedia?.type?.startsWith('video/') ? (
                              <video
                                src={editMediaPreview}
                                controls
                                className="max-w-xs rounded-lg"
                              />
                            ) : (
                              <div className="p-2 bg-gray-100 rounded-md">
                                <Paperclip className="h-6 w-6 inline mr-2" />
                                {editPostMedia?.name}
                              </div>
                            )
                          ) : (
                            <img
                              src={editMediaPreview}
                              alt={t('mediaPreview') || 'Попередній перегляд'}
                              className="max-w-xs rounded-lg"
                            />
                          )}
                          <button
                            onClick={clearEditPostMedia}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                            aria-label={t('removeMedia') || 'Видалити медіа'}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*,video/*,.pdf"
                        onChange={handleEditPostMediaChange}
                        className="w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      {t('cancel') || 'Скасувати'}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      onClick={handleUpdatePost}
                    >
                      {t('update') || 'Оновити'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default SocialFeed;