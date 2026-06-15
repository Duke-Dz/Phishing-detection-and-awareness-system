import React, { useState } from 'react';
import FileUpload from '../../components/common/FileUpload';
import api from '../../services/api';

/**
 * User profile page allowing name updates and avatar uploads.
 */
const ProfilePage = () => {
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // await api.post('/users/avatar', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' }
    // });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    // await api.put('/users/profile', { full_name: fullName });
  };

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <FileUpload onFileSelect={handleAvatarUpload} accept="image/*" />
      <form onSubmit={handleProfileUpdate}>
        {/* Name input fields */}
      </form>
    </div>
  );
};

export default ProfilePage;
