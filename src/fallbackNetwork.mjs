// -*- coding: utf-8, tab-width: 2 -*-

import kebabCase from 'just-kebab-case'; // lodash.kebabcase('a1') = 'a-1'

import learn from './learn.mjs';


const EX = async function maybeInstallFallbackNetwork(dd) {
  if (Object.keys(dd.net || false).length) { return; }

  const projName = dd.proj.name;

  const nets = {
    default: {
      BRIDGE: { name: 'br-' + kebabCase(projName) },
    },
  };

  await learn.oneLateFile(dd, {
    file: 'devdock-internal://default-network',
  }, { FMT: '3', nets });
};


export default EX;
