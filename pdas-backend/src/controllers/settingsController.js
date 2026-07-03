const { SystemSetting } = require("../models");
const { createError } = require("../utils/inputValidation");
const auditService = require("../services/auditService");

/**
 * @desc    Get all public system settings mapped as key-value pairs
 * @route   GET /api/settings
 * @access  Public
 */
const getSettings = async (req, res) => {
  const settings = await SystemSetting.findAll();
  
  // Convert array of objects to key-value pairs
  const settingsMap = {};
  settings.forEach(s => {
    settingsMap[s.key] = s.value;
  });

  res.json({
    success: true,
    data: settingsMap,
  });
};

/**
 * @desc    Update a specific system setting by key
 * @route   PUT /api/settings/:key
 * @access  Private (Admin)
 */
const updateSetting = async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const setting = await SystemSetting.findByPk(key);
  if (!setting) throw createError("Setting not found", 404);

  setting.value = value;
  await setting.save();

  auditService.logAction({
    userId: req.user.user_id,
    action: "admin.update_setting",
    entityType: "setting",
    entityId: key,
    details: { key, newValue: value },
    req,
  });

  res.json({
    success: true,
    message: "Setting updated",
    data: setting,
  });
};

module.exports = {
  getSettings,
  updateSetting,
};
