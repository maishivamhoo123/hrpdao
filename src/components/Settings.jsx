// src/components/Settings.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaSave, FaTrash, FaBell, FaLock, FaGlobe, FaUserShield, FaDownload, FaChevronRight } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [profileSettings, setProfileSettings] = useState({
    username: '',
    email: '',
    phone: '',
    email_notifications: true,
    push_notifications: true,
    language: 'uk',
    theme: 'light'
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_online_status: true,
    allow_messages_from: 'everyone',
    show_last_seen: true,
    two_factor_enabled: false
  });
 
  const [securitySettings, setSecuritySettings] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        if (!user) {
          navigate('/');
          return;
        }
        
        setCurrentUser(user);
     
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('username, email, phone, settings')
          .eq('id', user.id)
          .single();
          
        if (userError) throw userError;
 
        const userSettings = userData.settings || {};
        
        setProfileSettings({
          username: userData.username || '',
          email: userData.email || user.email || '',
          phone: userData.phone || '',
          email_notifications: userSettings.email_notifications !== undefined ? userSettings.email_notifications : true,
          push_notifications: userSettings.push_notifications !== undefined ? userSettings.push_notifications : true,
          language: userSettings.language || i18n.language || 'uk',
          theme: userSettings.theme || 'light'
        });
        
        setPrivacySettings({
          profile_visibility: userSettings.profile_visibility || 'public',
          show_online_status: userSettings.show_online_status !== undefined ? userSettings.show_online_status : true,
          allow_messages_from: userSettings.allow_messages_from || 'everyone',
          show_last_seen: userSettings.show_last_seen !== undefined ? userSettings.show_last_seen : true,
          two_factor_enabled: userSettings.two_factor_enabled || false
        });
        
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
        setError(t('settingsLoadError') || 'Помилка завантаження налаштувань');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [t, navigate, i18n.language]);

  const handleProfileSettingsChange = (field, value) => {
    setProfileSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacySettingsChange = (field, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecuritySettingsChange = (field, value) => {
    setSecuritySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    if (!currentUser) return;
    
    try {
      setSaving(true);
      setError(null);
  
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: profileSettings.username,
          phone: profileSettings.phone,
          settings: {
            ...profileSettings,
            ...privacySettings
          }
        })
        .eq('id', currentUser.id);
        
      if (updateError) throw updateError;
 
      i18n.changeLanguage(profileSettings.language);
      localStorage.setItem('language', profileSettings.language);

      if (profileSettings.theme) {
        document.documentElement.classList.toggle('dark', profileSettings.theme === 'dark');
        localStorage.setItem('theme', profileSettings.theme);
      }
      
      toast.success(t('settingsSaved') || 'Налаштування успішно збережено');
    } catch (err) {
      console.error('Помилка збереження налаштувань:', err);
      setError(t('settingsSaveError') || 'Помилка збереження налаштувань');
      toast.error(t('settingsSaveError') || 'Помилка збереження налаштувань');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!securitySettings.new_password || !securitySettings.current_password) {
      setError(t('fillAllFields') || 'Заповніть всі обов\'язкові поля');
      return;
    }
    
    if (securitySettings.new_password !== securitySettings.confirm_password) {
      setError(t('passwordsDontMatch') || 'Паролі не співпадають');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: securitySettings.new_password
      });
      
      if (updateError) throw updateError;

      setSecuritySettings({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      toast.success(t('passwordChanged') || 'Пароль успішно змінено');
    } catch (err) {
      console.error('Помилка зміни пароля:', err);
      setError(t('passwordChangeError') || 'Помилка зміни пароля');
      toast.error(t('passwordChangeError') || 'Помилка зміни пароля');
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
        
      if (userError) throw userError;

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', currentUser.id);
        
      if (postsError) throw postsError;
      
      const exportData = {
        user: userData,
        posts: postsData || [],
        exported_at: new Date().toISOString()
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `hrw-data-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success(t('dataExported') || 'Дані успішно експортовано');
    } catch (err) {
      console.error('Помилка експорту даних:', err);
      toast.error(t('exportError') || 'Помилка експорту даних');
    }
  };

  const deleteAccount = async () => {
    if (!confirm(t('confirmDeleteAccount') || 'Ви впевнені, що хочете видалити акаунт? Цю дію неможливо скасувати.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        currentUser.id
      );
      
      if (deleteError) throw deleteError;

      const { error: userDataError } = await supabase
        .from('users')
        .delete()
        .eq('id', currentUser.id);
        
      if (userDataError) throw userDataError;
      
      toast.success(t('accountDeleted') || 'Акаунт успішно видалено');
      navigate('/');
    } catch (err) {
      console.error('Помилка видалення акаунту:', err);
      setError(t('deleteAccountError') || 'Помилка видалення акаунту');
      toast.error(t('deleteAccountError') || 'Помилка видалення акаунту');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-center">{t('loading')}</div>;
  if (error) return <div className="p-4 text-red-500 text-center">{t('error')}: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar currentUser={currentUser} />
      
      <div className="w-full mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 mt-6">
        {/*Left panel */}
        <div className="lg:col-span-3">
          <Sidebar currentUser={currentUser} addPostButton={false} />
        </div>
        
        {/* Central panel */}
        <div className="lg:col-span-9">
          <div className="bg-white/95 p-6 rounded-2xl shadow-lg border border-blue-100 backdrop-blur-sm mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold text-blue-950">{t('settings')}</h1>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <div className="flex items-center">
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <div className="flex flex-wrap gap-1 mb-8 border-b border-blue-100">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-lg ${
                  activeTab === 'profile' 
                    ? 'text-blue-800 bg-blue-50 border-b-2 border-blue-600' 
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                {t('profileSettings')}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-lg ${
                  activeTab === 'privacy' 
                    ? 'text-blue-800 bg-blue-50 border-b-2 border-blue-600' 
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                {t('privacySettings')}
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-lg ${
                  activeTab === 'security' 
                    ? 'text-blue-800 bg-blue-50 border-b-2 border-blue-600' 
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                {t('securitySettings')}
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`px-5 py-3 text-sm font-medium transition-all rounded-t-lg ${
                  activeTab === 'data' 
                    ? 'text-blue-800 bg-blue-50 border-b-2 border-blue-600' 
                    : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                }`}
              >
                {t('dataManagement')}
              </button>
            </div>
            
            {/* Profile settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-blue-950 flex items-center gap-2">
                  <FaUserShield className="text-blue-600" /> {t('profileSettings')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('username')}
                    </label>
                    <input
                      type="text"
                      value={profileSettings.username}
                      onChange={(e) => handleProfileSettingsChange('username', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('email')}
                    </label>
                    <input
                      type="email"
                      value={profileSettings.email}
                      disabled
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-sm shadow-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">{t('emailCannotBeChanged')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('phone')}
                    </label>
                    <input
                      type="tel"
                      value={profileSettings.phone}
                      onChange={(e) => handleProfileSettingsChange('phone', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="+380XXXXXXXXX"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('language')}
                    </label>
                    <select
                      value={profileSettings.language}
                      onChange={(e) => handleProfileSettingsChange('language', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="uk">Українська</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('theme')}
                    </label>
                    <select
                      value={profileSettings.theme}
                      onChange={(e) => handleProfileSettingsChange('theme', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="light">{t('lightTheme')}</option>
                      <option value="dark">{t('darkTheme')}</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4 pt-6 border-t border-blue-100">
                  <h3 className="text-md font-medium text-blue-950 flex items-center gap-2">
                    <FaBell className="text-blue-600" /> {t('notifications')}
                  </h3>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <label className="text-sm font-medium text-blue-950">
                        {t('emailNotifications')}
                      </label>
                      <p className="text-xs text-blue-600">{t('receiveEmailNotifications')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileSettings.email_notifications}
                        onChange={(e) => handleProfileSettingsChange('email_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <label className="text-sm font-medium text-blue-950">
                        {t('pushNotifications')}
                      </label>
                      <p className="text-xs text-blue-600">{t('receivePushNotifications')}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profileSettings.push_notifications}
                        onChange={(e) => handleProfileSettingsChange('push_notifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <FaSave /> {saving ? t('saving') : t('saveChanges')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Privacy settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-blue-950 flex items-center gap-2">
                  <FaLock className="text-blue-600" /> {t('privacySettings')}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('profileVisibility')}
                    </label>
                    <select
                      value={privacySettings.profile_visibility}
                      onChange={(e) => handlePrivacySettingsChange('profile_visibility', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="public">{t('public')}</option>
                      <option value="friends">{t('friendsOnly')}</option>
                      <option value="private">{t('private')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('allowMessagesFrom')}
                    </label>
                    <select
                      value={privacySettings.allow_messages_from}
                      onChange={(e) => handlePrivacySettingsChange('allow_messages_from', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    >
                      <option value="everyone">{t('everyone')}</option>
                      <option value="friends">{t('friendsOnly')}</option>
                      <option value="nobody">{t('nobody')}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-blue-100">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <label className="text-sm font-medium text-blue-950">
                          {t('showOnlineStatus')}
                        </label>
                        <p className="text-xs text-blue-600">{t('showWhenOnline')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_online_status}
                          onChange={(e) => handlePrivacySettingsChange('show_online_status', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <label className="text-sm font-medium text-blue-950">
                          {t('showLastSeen')}
                        </label>
                        <p className="text-xs text-blue-600">{t('showLastSeenTime')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.show_last_seen}
                          onChange={(e) => handlePrivacySettingsChange('show_last_seen', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <label className="text-sm font-medium text-blue-950">
                          {t('twoFactorAuthentication')}
                        </label>
                        <p className="text-xs text-blue-600">{t('enhanceAccountSecurity')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacySettings.two_factor_enabled}
                          onChange={(e) => handlePrivacySettingsChange('two_factor_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <FaSave /> {saving ? t('saving') : t('saveChanges')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Security settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-blue-950 flex items-center gap-2">
                  <FaLock className="text-blue-600" /> {t('securitySettings')}
                </h2>
                
                <div className="space-y-4 max-w-lg">
                  <div className="relative">
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('currentPassword')}
                    </label>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={securitySettings.current_password}
                      onChange={(e) => handleSecuritySettingsChange('current_password', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-10 text-gray-400 hover:text-blue-600"
                    >
                      {showCurrentPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('newPassword')}
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={securitySettings.new_password}
                      onChange={(e) => handleSecuritySettingsChange('new_password', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-10 text-gray-400 hover:text-blue-600"
                    >
                      {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <label className="block text-sm font-medium text-blue-950 mb-2">
                      {t('confirmPassword')}
                    </label>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={securitySettings.confirm_password}
                      onChange={(e) => handleSecuritySettingsChange('confirm_password', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-blue-950 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-10 text-gray-400 hover:text-blue-600"
                    >
                      {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  
                  <button
                    onClick={changePassword}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 text-white rounded-full hover:from-blue-950 hover:via-blue-900 hover:to-blue-800 transition-all duration-300 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg mt-4"
                  >
                    <FaSave size={14} /> {saving ? t('saving') : t('changePassword')}
                  </button>
                </div>
              </div>
            )}
            
            {/* Data management */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-blue-950 flex items-center gap-2">
                  <FaGlobe className="text-blue-600" /> {t('dataManagement')}
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                    <h3 className="text-md font-medium text-blue-950 mb-2 flex items-center gap-2">
                      <FaDownload className="text-blue-600" /> {t('exportData')}
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                      {t('exportDataDescription')}
                    </p>
                    <button
                      onClick={exportData}
                      className="px-4 py-2.5 bg-white text-blue-800 rounded-full border border-blue-200 hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
                    >
                      <FaDownload size={12} /> {t('exportData')}
                    </button>
                  </div>
                  
                  <div className="bg-red-50/50 p-5 rounded-2xl border border-red-200">
                    <h3 className="text-md font-medium text-blue-950 mb-2 flex items-center gap-2">
                      <FaTrash className="text-red-600" /> {t('deleteAccount')}
                    </h3>
                    <p className="text-sm text-blue-800 mb-4">
                      {t('deleteAccountWarning')}
                    </p>
                    <button
                      onClick={deleteAccount}
                      className="px-4 py-2.5 bg-white text-red-600 rounded-full border border-red-200 hover:bg-red-50 transition-all duration-200 flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
                    >
                      <FaTrash size={12} /> {t('deleteAccount')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Settings;