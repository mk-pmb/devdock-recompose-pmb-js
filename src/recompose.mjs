// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be.js';
import pEachSeries from 'p-each-series';

import learn from './learn.mjs';
import maybeInstallFallbackNetwork from './fallbackNetwork.mjs';
import oppoHaxx from './oppoHaxx.mjs';
import scanDirs from './scanDirs.mjs';
import toComposeFile from './toComposeFile.mjs';


const EX = async function recompose(overrides) {
  await oppoHaxx();
  const dd = mergeOpt(EX.defaults, overrides);
  mustBe.nest('project name', dd.proj.name);
  const partFiles = await scanDirs(dd);
  await oppoHaxx();
  await pEachSeries(partFiles, ({ impl, ...meta }) => learn(dd, meta, impl));
  await maybeInstallFallbackNetwork(dd);
  Object.assign(dd, EX.api);
  return dd;
};


Object.assign(EX, {

  defaults: {
    proj: {
      composeFileFormat: '3',
    },
  },

  api: {
    toComposeFile,
  },

});



export default EX;
