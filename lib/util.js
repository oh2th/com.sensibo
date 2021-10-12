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
  const retMap = new Map();
  for (let mode of modes) {
    const fanLevels = getFanLevels(remoteCapabilities, mode);
    if (fanLevels) {
      for (let fanLevel of fanLevels) {
        retMap.set(fanLevel, fanLevel);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const getSwings = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ?
    remoteCapabilities.modes[mode].swing : undefined;
};

const getAllSwings = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const retMap = new Map();
  for (let mode of modes) {
    const swings = getSwings(remoteCapabilities, mode);
    if (swings) {
      for (let swing of swings) {
        retMap.set(swing, swing);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const getHorizontalSwings = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ?
    remoteCapabilities.modes[mode].horizontalSwing : undefined;
};

const getAllHorizontalSwings = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const retMap = new Map();
  for (let mode of modes) {
    const swings = getHorizontalSwings(remoteCapabilities, mode);
    if (swings) {
      for (let swing of swings) {
        retMap.set(swing, swing);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const AIR_QUALITIES = {
  1: 'Excellent',
  2: 'Fair',
  3: 'Poor'
};

module.exports = {
  getModes: getModes,
  getFanLevels: getFanLevels,
  getAllFanLevels: getAllFanLevels,
  getSwings: getSwings,
  getAllSwings: getAllSwings,
  getHorizontalSwings: getHorizontalSwings,
  getAllHorizontalSwings: getAllHorizontalSwings,
  AIR_QUALITIES: AIR_QUALITIES
};
