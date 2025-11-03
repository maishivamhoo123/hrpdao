import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimesCircle, FaEye, FaComment, FaShare, FaBookmark, FaTrash, FaEdit, FaReply } from 'react-icons/fa';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ComplaintForm from './ComplaintForm';
import DonationSection from './DonationSection';

function Comments() {
  const { t } = useTranslation();
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editPostId, setEditPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [isEditCommentModalOpen, setIsEditCommentModalOpen] = useState(false);
  const [replyCommentId, setReplyCommentId] = useState(null);
  const [newReply, setNewReply] = useState('');

  // Notification creation feature
  const createNotification = async (userId, type, message, data = {}) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          sender_id: currentUser.id,
          type,
          message,
          post_id: data.postId || null,
          comment_id: data.commentId || null,
          community_id: data.communityId || null,
          chat_id: data.chatId || null,
          is_read: false
        });

      if (error) {
        console.error('Помилка створення сповіщення:', error);
      }
    } catch (err) {
      console.error('Помилка у createNotification:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        setCurrentUser(user);

        // Fetch post with reactions and comment count
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            users(username, profile_picture, country),
            reactions(reaction_type, user_id),
            comments(count)
          `)
          .eq('id', postId)
          .single();
        if (postError) throw postError;
        setPost(postData);

        // Fetch comments with reactions and replies
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .select(`
            id, content, created_at, user_id, parent_comment_id,
            users(username, profile_picture),
            comment_reactions(reaction_type, user_id)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        if (commentError) throw commentError;
        setComments(commentData || []);
      } catch (err) {
        console.error('Помилка:', err);
        setError(err.message || t('unexpectedError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, t]);

  const handleComment = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!newComment) {
      setError(t('emptyComment'));
      return;
    }
    try {
      const { data: commentData, error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: currentUser.id,
        content: newComment,
      }).select().single();
      
      if (error) throw error;
      setNewComment('');
      
      // Creating a notification for the post author
      if (post && post.user_id !== currentUser.id) {
        await createNotification(
          post.user_id,
          'comment',
          `${currentUser.email || t('anonymous')} ${t('commentedOnYourPost')}`,
          { postId, commentId: commentData.id }
        );
      }

      // Updating the number of comments on a post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users(username, profile_picture, country),
          reactions(reaction_type, user_id),
          comments(count)
        `)
        .eq('id', postId)
        .single();
      if (postError) throw postError;
      setPost(postData);

      // Updating the list of comments
      const { data: commentDataUpdated, error: commentError } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id, parent_comment_id,
          users(username, profile_picture),
          comment_reactions(reaction_type, user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (commentError) throw commentError;
      setComments(commentDataUpdated || []);
    } catch (err) {
      console.error('Помилка додавання коментаря:', err);
      setError(err.message || t('commentError'));
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!newReply) {
      setError(t('emptyComment'));
      return;
    }
    try {
      // We find the parent comment to get information about the author
      const parentComment = comments.find(comment => comment.id === parentCommentId);
      
      const { data: replyData, error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: currentUser.id,
        content: newReply,
        parent_comment_id: parentCommentId,
      }).select().single();
      
      if (error) throw error;
      setNewReply('');
      setReplyCommentId(null);
      
      // Create a notification for the author of a parent comment
      if (parentComment && parentComment.user_id !== currentUser.id) {
        await createNotification(
          parentComment.user_id,
          'comment',
          `${currentUser.email || t('anonymous')} ${t('repliedToYourComment')}`,
          { postId, commentId: replyData.id }
        );
      }

      // Updating the number of comments on a post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users(username, profile_picture, country),
          reactions(reaction_type, user_id),
          comments(count)
        `)
        .eq('id', postId)
        .single();
      if (postError) throw postError;
      setPost(postData);

      // Updating the list of comments
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id, parent_comment_id,
          users(username, profile_picture),
          comment_reactions(reaction_type, user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (commentError) throw commentError;
      setComments(commentData || []);
    } catch (err) {
      console.error('Помилка додавання відповіді:', err);
      setError(err.message || t('commentError'));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!window.confirm(t('confirmDeleteComment'))) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      
      // Updating the number of comments on a post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users(username, profile_picture, country),
          reactions(reaction_type, user_id),
          comments(count)
        `)
        .eq('id', postId)
        .single();
      if (postError) throw postError;
      setPost(postData);

      // Updating the list of comments
      setComments(comments.filter((comment) => comment.id !== commentId));
      alert(t('commentDeleted'));
    } catch (err) {
      console.error('Помилка видалення коментаря:', err);
      setError(t('deleteCommentError'));
    }
  };

  const handleEditComment = (commentId, content) => {
    setEditCommentId(commentId);
    setEditCommentContent(content);
    setIsEditCommentModalOpen(true);
  };

  const handleUpdateComment = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!editCommentContent) {
      setError(t('emptyComment'));
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase
        .from('comments')
        .update({ content: editCommentContent })
        .eq('id', editCommentId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      
      // Updating the list of comments
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id, parent_comment_id,
          users(username, profile_picture),
          comment_reactions(reaction_type, user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (commentError) throw commentError;
      setComments(commentData || []);
      
      setIsEditCommentModalOpen(false);
      setEditCommentId(null);
      setEditCommentContent('');
    } catch (err) {
      console.error('Помилка оновлення коментаря:', err);
      setError(t('updateCommentError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCommentReaction = async (commentId, reactionType) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    try {
      // We find a comment to get information about the author
      const comment = comments.find(c => c.id === commentId);
      
      const { data: existingReaction, error: fetchError } = await supabase
        .from('comment_reactions')
        .select('reaction_type')
        .eq('comment_id', commentId)
        .eq('user_id', currentUser.id)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          const { error: deleteError } = await supabase
            .from('comment_reactions')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', currentUser.id);
          if (deleteError) throw deleteError;
        } else {
          const { error: updateError } = await supabase
            .from('comment_reactions')
            .update({ reaction_type: reactionType })
            .eq('comment_id', commentId)
            .eq('user_id', currentUser.id);
          if (updateError) throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from('comment_reactions').insert({
          comment_id: commentId,
          user_id: currentUser.id,
          reaction_type: reactionType,
        });
        if (insertError) throw insertError;
        
        // Create a notification for the author of a comment about a like
        if (comment && comment.user_id !== currentUser.id) {
          const reactionText = reactionType === 'true' ? t('likedYourComment') : t('dislikedYourComment');
          await createNotification(
            comment.user_id,
            'comment_like',
            `${currentUser.email || t('anonymous')} ${reactionText}`,
            { postId, commentId }
          );
        }
      }
      
      // Updating the list of comments
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, user_id, parent_comment_id,
          users(username, profile_picture),
          comment_reactions(reaction_type, user_id)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (commentError) throw commentError;
      setComments(commentData || []);
    } catch (err) {
      console.error('Помилка обробки реакції на коментар:', err);
      setError(err.message || t('reactionError'));
    }
  };

  const handleEditPost = (postId, content) => {
    setEditPostId(postId);
    setEditPostContent(content);
    setIsEditModalOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase
        .from('posts')
        .update({ content: editPostContent })
        .eq('id', editPostId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      
      // Updating the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users(username, profile_picture, country),
          reactions(reaction_type, user_id),
          comments(count)
        `)
        .eq('id', postId)
        .single();
      if (postError) throw postError;
      setPost(postData);
      
      setIsEditModalOpen(false);
      setEditPostId(null);
      setEditPostContent('');
    } catch (err) {
      console.error('Помилка оновлення поста:', err);
      setError(t('updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    if (!window.confirm(t('confirmDeletePost'))) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Помилка видалення поста:', err);
      setError(t('deleteError'));
    }
  };

  const handleReaction = async (postId, reactionType) => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    try {
      const { data: existingReaction, error: fetchError } = await supabase
        .from('reactions')
        .select('reaction_type')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      if (existingReaction) {
        if (existingReaction.reaction_type === reactionType) {
          const { error: deleteError } = await supabase
            .from('reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', currentUser.id);
          if (deleteError) throw deleteError;
        } else {
          const { error: updateError } = await supabase
            .from('reactions')
            .update({ reaction_type: reactionType })
            .eq('post_id', postId)
            .eq('user_id', currentUser.id);
          if (updateError) throw updateError;
        }
      } else {
        const { error: insertError } = await supabase.from('reactions').insert({
          post_id: postId,
          user_id: currentUser.id,
          reaction_type: reactionType,
        });
        if (insertError) throw insertError;
        
        // Creating a notification for the post author about a reaction
        if (post && post.user_id !== currentUser.id) {
          let reactionText = '';
          switch (reactionType) {
            case 'true':
              reactionText = t('likedYourPost');
              break;
            case 'false':
              reactionText = t('dislikedYourPost');
              break;
            case 'focus':
              reactionText = t('focusedOnYourPost');
              break;
            default:
              reactionText = t('reactedToYourPost');
          }
          
          await createNotification(
            post.user_id,
            'like',
            `${currentUser.email || t('anonymous')} ${reactionText}`,
            { postId }
          );
        }
      }
      
      // We are updating the post with current reactions.
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          users(username, profile_picture, country),
          reactions(reaction_type, user_id),
          comments(count)
        `)
        .eq('id', postId)
        .single();
      if (postError) throw postError;
      setPost(postData);
    } catch (err) {
      console.error('Помилка обробки реакції:', err);
      setError(err.message || t('reactionError'));
    }
  };

  const handleShare = async () => {
    try {
      const shareText = `${post.content}\n${post.media_url || ''}`;
      if (navigator.share) {
        await navigator.share({
          title: t('sharePost'),
          text: shareText,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        alert(t('copiedToClipboard'));
      }
    } catch (err) {
      console.error('Помилка шарингу:', err);
      setError(t('shareError'));
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      setError(t('authRequired'));
      navigate('/');
      return;
    }
    try {
      const { data: existingSave, error: fetchError } = await supabase
        .from('saved_posts')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('post_id', postId)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (existingSave) {
        const { error: deleteError } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', postId);
        if (deleteError) throw deleteError;
        alert(t('postUnsaved'));
      } else {
        const { error: insertError } = await supabase
          .from('saved_posts')
          .insert({ user_id: currentUser.id, post_id: postId });
        if (insertError) throw insertError;
        alert(t('postSaved'));
        
        // Create a notification for the author of a post about saving
        if (post && post.user_id !== currentUser.id) {
          await createNotification(
            post.user_id,
            'like',
            `${currentUser.email || t('anonymous')} ${t('savedYourPost')}`,
            { postId }
          );
        }
      }
    } catch (err) {
      console.error('Помилка збереження поста:', err);
      setError(t('saveError'));
    }
  };

  const renderPostContent = (content) => {
    if (!content) return null;
    const hashtagRegex = /#[^\s#]+/g;
    const parts = content.split(hashtagRegex);
    const hashtags = content.match(hashtagRegex) || [];
    let result = [];
    parts.forEach((part, index) => {
      result.push(<span key={`part-${index}`}>{part}</span>);
      if (hashtags[index]) {
        result.push(
          <button
            key={`hashtag-${index}`}
            className="text-blue-500 hover:underline"
            onClick={() => navigate(`/hashtag/${hashtags[index].slice(1)}`)}
          >
            {hashtags[index]}
          </button>
        );
      }
    });
    return result;
  };

  const renderComments = (comments, parentId = null, depth = 0) => {
    const filteredComments = comments.filter((comment) => comment.parent_comment_id === parentId);
    
    if (filteredComments.length === 0) return null;

    return filteredComments.map((comment) => (
      <div key={comment.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''} mt-3 bg-white p-4 rounded-lg shadow-sm relative`}>
        {/* Nesting depth indicator */}
        {depth > 0 && (
          <div className="absolute -left-2 top-4 w-2 h-2 bg-gray-400 rounded-full"></div>
        )}
        
        {currentUser?.id === comment.user_id && (
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={() => handleEditComment(comment.id, comment.content)}
              className="text-gray-500 hover:text-blue-500 transition-colors"
              aria-label={t('editComment')}
            >
              <FaEdit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-gray-500 hover:text-red-500 transition-colors"
              aria-label={t('deleteComment')}
            >
              <FaTrash className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
            {comment.users?.username?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-bold text-sm text-gray-800">{comment.users?.username || t('anonymous')}</p>
            <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mb-3">{comment.content}</p>
        
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => handleCommentReaction(comment.id, 'true')}
            className={`flex items-center text-xs transition-colors ${
              comment.comment_reactions?.some((r) => r.user_id === currentUser?.id && r.reaction_type === 'true')
                ? 'text-green-700 font-semibold'
                : 'text-green-500 hover:text-green-600'
            }`}
          >
            <FaCheckCircle className="h-3 w-3 mr-1" /> 
            {comment.comment_reactions?.filter((r) => r.reaction_type === 'true').length || 0}
          </button>
          
          <button
            onClick={() => handleCommentReaction(comment.id, 'false')}
            className={`flex items-center text-xs transition-colors ${
              comment.comment_reactions?.some((r) => r.user_id === currentUser?.id && r.reaction_type === 'false')
                ? 'text-red-700 font-semibold'
                : 'text-red-500 hover:text-red-600'
            }`}
          >
            <FaTimesCircle className="h-3 w-3 mr-1" /> 
            {comment.comment_reactions?.filter((r) => r.reaction_type === 'false').length || 0}
          </button>
          
          <button
            onClick={() => setReplyCommentId(comment.id)}
            className="flex items-center text-xs text-blue-500 hover:text-blue-600 transition-colors"
          >
            <FaReply className="h-3 w-3 mr-1" /> {t('reply')}
          </button>
        </div>

        {/* Answer form */}
        {replyCommentId === comment.id && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              placeholder={t('newReplyPlaceholder')}
              className="w-full resize-y border border-gray-300 rounded-md p-2 text-sm"
              rows="2"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleReply(comment.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
              >
                {t('postReply')}
              </button>
              <button
                onClick={() => setReplyCommentId(null)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Recursively display answers */}
        {renderComments(comments, comment.id, depth + 1)}
      </div>
    ));
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return <div className="p-4 text-red-500">{t('error')}: {error}</div>;
  if (!post) return <div className="p-4">{t('noPost')}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar currentUser={currentUser} />
      
      <div className="w-full mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 mt-4">
        {/* Left panel */}
        <div className="lg:col-span-3">
          <Sidebar currentUser={currentUser} addPostButton={false} />
        </div>
        
        {/* Central panel */}
        <div className="lg:col-span-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            {/* Post */}
            <div className="bg-white p-4 rounded-lg shadow-sm relative mb-6">
              {currentUser?.id === post.user_id && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleEditPost(post.id, post.content)}
                    className="text-gray-500 hover:text-blue-500 transition-colors"
                    aria-label={t('editPost')}
                  >
                    <FaEdit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePost()}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    aria-label={t('deletePost')}
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center mb-2">
                <img
                  src={post.users?.profile_picture || 'https://placehold.co/40x40'}
                  alt={t('profilePicture')}
                  className="w-10 h-10 rounded-full mr-2"
                />
                <div>
                  <p className="font-bold">{post.users?.username || t('anonymous')}</p>
                  <p className="text-sm text-gray-500">{post.users?.country || t('unknown')} • {new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p>{renderPostContent(post.content)}</p>
              {post.media_url && (
                post.media_type === 'image' ? (
                  <img src={post.media_url} alt={t('postMedia')} className="w-full mt-2 rounded-lg" />
                ) : (
                  <video src={post.media_url} controls className="w-full mt-2 rounded-lg" aria-label={t('postMedia')} />
                )
              )}
              <div className="flex items-center gap-1.5 mt-3 max-w-full min-w-0">
                <button
                  onClick={() => handleReaction(post.id, 'true')}
                  className={`post-action-btn flex items-center text-xs transition-colors ${
                    post.reactions?.some((r) => r.user_id === currentUser?.id && r.reaction_type === 'true')
                      ? 'text-green-700 font-semibold'
                      : 'text-green-500 hover:text-green-600'
                  }`}
                  aria-label={`${t('true')} ${t('reaction')}`}
                >
                  <FaCheckCircle className="h-3 w-3 mr-1" /> {t('true')} {post.reactions?.filter((r) => r.reaction_type === 'true').length || 0}
                </button>
                <button
                  onClick={() => handleReaction(post.id, 'false')}
                  className={`post-action-btn flex items-center text-xs transition-colors ${
                    post.reactions?.some((r) => r.user_id === currentUser?.id && r.reaction_type === 'false')
                      ? 'text-red-700 font-semibold'
                      : 'text-red-500 hover:text-red-600'
                  }`}
                  aria-label={`${t('false')} ${t('reaction')}`}
                >
                  <FaTimesCircle className="h-3 w-3 mr-1" /> {t('false')} {post.reactions?.filter((r) => r.reaction_type === 'false').length || 0}
                </button>
                <button
                  onClick={() => handleReaction(post.id, 'focus')}
                  className={`post-action-btn flex items-center text-xs transition-colors ${
                    post.reactions?.some((r) => r.user_id === currentUser?.id && r.reaction_type === 'focus')
                      ? 'text-blue-700 font-semibold'
                      : 'text-blue-500 hover:text-blue-600'
                  }`}
                  aria-label={`${t('focus')} ${t('reaction')}`}
                >
                  <FaEye className="h-3 w-3 mr-1" /> {t('focus')} {post.reactions?.filter((r) => r.reaction_type === 'focus').length || 0}
                </button>
                <button
                  className="post-action-btn flex items-center text-xs transition-colors text-gray-500 hover:text-gray-600"
                  aria-label={t('comment')}
                >
                  <FaComment className="h-3 w-3 mr-1" /> {t('comment')} {post.comments?.count || 0}
                </button>
                <button
                  onClick={() => handleShare()}
                  className="post-action-btn flex items-center text-xs transition-colors text-gray-500 hover:text-gray-600"
                  aria-label={t('share')}
                >
                  <FaShare className="h-3 w-3 mr-1" /> {t('share')}
                </button>
                <button
                  onClick={() => handleSave()}
                  className="post-action-btn flex items-center text-xs transition-colors text-gray-500 hover:text-gray-600"
                  aria-label={t('save')}
                >
                  <FaBookmark className="h-3 w-3 mr-1" /> {t('save')}
                </button>
              </div>
            </div>

            {/* New Comment Input */}
            {currentUser && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('addComment')}</h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('newCommentPlaceholder')}
                  className="w-full resize-y border border-gray-300 rounded-md p-2 mb-2 text-sm"
                  rows="3"
                  aria-label={t('newCommentPlaceholder')}
                />
                <button
                  onClick={handleComment}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300"
                  disabled={loading}
                  aria-label={t('postComment')}
                >
                  {t('postComment')}
                </button>
              </div>
            )}

            {/* Comments */}
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {t('comments')} ({comments.length})
              </h3>
              
              {comments.filter(comment => !comment.parent_comment_id).length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('noComments')}</p>
              ) : (
                <div className="space-y-4">
                  {renderComments(comments)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3 space-y-6">
          <div>
            <ComplaintForm setError={setError} error={error} />
          </div>
          <div>
            <DonationSection />
          </div>
        </div>
      </div>

      {/* Edit Post Modal */}
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
                    {t('editPost')}
                  </Dialog.Title>
                  <div className="mt-2">
                    <textarea
                      value={editPostContent}
                      onChange={(e) => setEditPostContent(e.target.value)}
                      className="w-full resize-y border border-gray-300 rounded-md p-2 text-sm"
                      rows="4"
                      aria-label={t('editPost')}
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={handleUpdatePost}
                    >
                      {t('save')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsEditModalOpen(false)}
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

      {/* Edit Comment Modal */}
      <Transition appear show={isEditCommentModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditCommentModalOpen(false)}>
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
                    {t('editComment')}
                  </Dialog.Title>
                  <div className="mt-2">
                    <textarea
                      value={editCommentContent}
                      onChange={(e) => setEditCommentContent(e.target.value)}
                      className="w-full resize-y border border-gray-300 rounded-md p-2 text-sm"
                      rows="4"
                      aria-label={t('editComment')}
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={handleUpdateComment}
                    >
                      {t('save')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsEditCommentModalOpen(false)}
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
    </div>
  );
}

export default Comments;