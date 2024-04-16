'use strict';

const sleep = (seconds) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

const randomDelay = (minSeconds, maxSeconds) => {
  const randomDelay = Math.random() * (maxSeconds - minSeconds) + minSeconds;
  return new Promise((resolve) => setTimeout(resolve, randomDelay * 1000));
};

const getModes = (remoteCapabilities) => {
  return remoteCapabilities && remoteCapabilities.modes ? Object.keys(remoteCapabilities.modes) : undefined;
};

const getFanLevels = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ? remoteCapabilities.modes[mode].fanLevels : undefined;
};

const getAllFanLevels = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const retMap = new Map();
  for (const mode of modes) {
    const fanLevels = getFanLevels(remoteCapabilities, mode);
    if (fanLevels) {
      for (const fanLevel of fanLevels) {
        retMap.set(fanLevel, fanLevel);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const getSwings = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ? remoteCapabilities.modes[mode].swing : undefined;
};

const getAllSwings = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const retMap = new Map();
  for (const mode of modes) {
    const swings = getSwings(remoteCapabilities, mode);
    if (swings) {
      for (const swing of swings) {
        retMap.set(swing, swing);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const getHorizontalSwings = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ? remoteCapabilities.modes[mode].horizontalSwing : undefined;
};

const getAllHorizontalSwings = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const retMap = new Map();
  for (const mode of modes) {
    const swings = getHorizontalSwings(remoteCapabilities, mode);
    if (swings) {
      for (const swing of swings) {
        retMap.set(swing, swing);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const getLights = (remoteCapabilities, mode) => {
  return mode && remoteCapabilities && remoteCapabilities.modes[mode] ? remoteCapabilities.modes[mode].light : undefined;
};

const getAllLights = (remoteCapabilities) => {
  const modes = getModes(remoteCapabilities);
  if (!modes) {
    return;
  }
  const retMap = new Map();
  for (const mode of modes) {
    const lights = getLights(remoteCapabilities, mode);
    if (lights) {
      for (const light of lights) {
        retMap.set(light, light);
      }
    }
  }
  return retMap.size ? Array.from(retMap.keys()) : undefined;
};

const AIR_QUALITIES = {
  1: 'Excellent',
  2: 'Fair',
  3: 'Poor',
};

module.exports = {
  sleep,
  randomDelay,
  getModes,
  getFanLevels,
  getAllFanLevels,
  getSwings,
  getAllSwings,
  getHorizontalSwings,
  getAllHorizontalSwings,
  getLights,
  getAllLights,
  AIR_QUALITIES,
};
