import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * Admin page for managing public system settings (e.g., social links, hero text)
 */
const SettingsPage = () => {
  const [settings, setSettings] = useState({
    contact_email: '',
    twitter_url: '',
    linkedin_url: '',
    hero_text: ''
  });

  useEffect(() => {
    // api.get('/settings').then(...)
  }, []);

  const handleSave = async (key, value) => {
    // api.put(`/settings/${key}`, { value })
  };

  return (
    <div className="settings-page">
      <h1>System Settings</h1>
      {/* Form fields map goes here */}
    </div>
  );
};

export default SettingsPage;
