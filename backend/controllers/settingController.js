const asyncHandler = require('express-async-handler');
const Setting = require('../models/Setting');

// Default fallback platform configurations
const DEFAULT_SETTINGS = {
  ticketPrice: 50,
  penaltyLimit: 3,
  cancelDeadlineHours: 2,
  autoPromoteSeat: true
};

const getSettings = asyncHandler(async (req, res) => {
  const settingsList = await Setting.find();
  const settingsObj = { ...DEFAULT_SETTINGS };

  settingsList.forEach((s) => {
    settingsObj[s.key] = s.value;
  });

  res.json({ settings: settingsObj });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settingsData = req.body; // E.g., { ticketPrice: 55, ... }

  const updatePromises = Object.keys(settingsData).map(async (key) => {
    return Setting.findOneAndUpdate(
      { key },
      { key, value: settingsData[key] },
      { upsert: true, new: true }
    );
  });

  await Promise.all(updatePromises);

  // Get complete updated list
  const settingsList = await Setting.find();
  const settingsObj = { ...DEFAULT_SETTINGS };

  settingsList.forEach((s) => {
    settingsObj[s.key] = s.value;
  });

  res.json({ message: 'Settings updated successfully', settings: settingsObj });
});

module.exports = { getSettings, updateSettings };
