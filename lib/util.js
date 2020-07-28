'use strict';

const getModes = (remoteCapabilities) => {
  return remoteCapabilities && remoteCapabilities.modes ?
    Object.keys(remoteCapabilities.modes) : undefined;
};

const getFanLevels = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ?
    remoteCapabilities.modes[mode].fanLevels : undefined;
};

const getAllFanLevels = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const fanLevelsMap = new Map();
  for (let mode of modes) {
    const fanLevels = getFanLevels(remoteCapabilities, mode);
    if (fanLevels) {
      for (let fanLevel of fanLevels) {
        fanLevelsMap.set(fanLevel, fanLevel);
      }
    }
  }
  return fanLevelsMap.size ? Array.from(fanLevelsMap.keys()) : undefined;
};

module.exports = {
  getModes: getModes,
  getFanLevels: getFanLevels,
  getAllFanLevels: getAllFanLevels,
};
