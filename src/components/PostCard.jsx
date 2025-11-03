import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { CheckCircle, XCircle, MessageSquare, Share, Bookmark, Trash2, Edit, UserPlus, UserMinus, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';

function PostCard({ 
  post, 
  currentUser, 
  followStatus, 
  onEdit, 
  onDelete, 
  onReaction, 
  onShare, 
  onSave, 
  onFollow,
  onNavigateToComments,
  isLast,
  lastPostRef 
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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

  return (
    <div 
      ref={isLast ? lastPostRef : null}
      className="bg-white p-4 rounded-lg shadow-md relative"
    >
      {currentUser?.id === post.user_id && (
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={() => onEdit(post.id, post.content, post.media_url, post.country_code)}
            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
            aria-label={t('editPost') || 'Редагувати пост'}
          >
            <Edit className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(post.id)}
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
                onClick={() => onFollow(post.user_id)}
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
            {post.users?.country || t('unknown') || 'Невідомо'} • {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div 
        className="mb-2 cursor-pointer"
        onClick={() => onNavigateToComments(post)}
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onReaction(post.id, 'true')}
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
            onClick={() => onReaction(post.id, 'false')}
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
            onClick={() => onReaction(post.id, 'top')}
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onNavigateToComments(post)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            aria-label={t('viewComments') || 'Переглянути коментарі'}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-xs font-medium">{post.comments_count || 0}</span>
          </button>
          <button
            onClick={() => onShare(post.id)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            aria-label={t('share') || 'Поширити'}
          >
            <Share className="h-4 w-4" />
          </button>
          <button
            onClick={() => onSave(post.id)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            aria-label={t('save') || 'Зберегти'}
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PostCard;