const asyncHandler = require('express-async-handler');
const { prisma } = require('../prisma/client');

const DEFAULT_SETTINGS = {
  ticketPrice: 50,
  penaltyLimit: 3,
  cancelDeadlineHours: 2,
  autoPromoteSeat: true,
};

const getSettings = asyncHandler(async (req, res) => {
  const settingsList = await prisma.setting.findMany();
  const settingsObj = { ...DEFAULT_SETTINGS };
  settingsList.forEach((s) => {
    settingsObj[s.key] = s.value;
  });
  res.json({ settings: settingsObj });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settingsData = req.body;
  await Promise.all(
    Object.keys(settingsData).map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: settingsData[key] },
        create: { key, value: settingsData[key] },
      })
    )
  );

  const settingsList = await prisma.setting.findMany();
  const settingsObj = { ...DEFAULT_SETTINGS };
  settingsList.forEach((s) => {
    settingsObj[s.key] = s.value;
  });
  res.json({ message: 'Settings updated successfully', settings: settingsObj });
});

module.exports = { getSettings, updateSettings };
