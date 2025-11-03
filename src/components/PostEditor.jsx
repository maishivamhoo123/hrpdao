import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Paperclip, XCircle } from 'lucide-react';
import countries from '../utils/countries';

function PostEditor({ currentUser, setPosts, setError, setLoading }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [editPostId, setEditPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostMedia, setEditPostMedia] = useState(null);
  const [editMediaPreview, setEditMediaPreview] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);

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

  const handleUpdatePost = async (existingPosts) => {
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
      let mediaType = existingPosts.find(p => p.id === editPostId)?.media_type || 'text';

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
        const currentPost = existingPosts.find(p => p.id === editPostId);
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
        const currentPost = existingPosts.find(p => p.id === editPostId);
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

  return (
    <>
      {showPostForm && (
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
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
            {mediaPreview && (
              <div className="relative mb-2">
                {newPostMedia?.type?.startsWith('image/') ? (
                  <img
                    src={mediaPreview}
                    alt={t('mediaPreview') || 'Попередній перегляд'}
                    className="max-w-xs rounded-lg"
                  />
                ) : newPostMedia?.type?.startsWith('video/') ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="max-w-xs rounded-lg"
                  />
                ) : (
                  <div className="p-2 bg-gray-100 rounded-md">
                    <Paperclip className="h-6 w-6 inline mr-2" />
                    {newPostMedia?.name}
                  </div>
                )}
                <button
                  onClick={clearNewPostMedia}
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
              onChange={handleNewPostMediaChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowPostForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
            >
              {t('cancel') || 'Скасувати'}
            </button>
            <button
              onClick={handleCreatePost}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              {t('post') || 'Опублікувати'}
            </button>
          </div>
        </div>
      )}
      <ToastContainer position="bottom-right" autoClose={3000} />
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
                      onClick={() => handleUpdatePost(setPosts(prev => prev))}
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
    </>
  );
}

export default PostEditor;