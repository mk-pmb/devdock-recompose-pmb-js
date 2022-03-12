// -*- coding: utf-8, tab-width: 2 -*-

import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be.js';
import kebabCase from 'lodash.kebabcase';

import scanDirs from './scanDirs.mjs';


async function recompose(overrides) {
  const dd = mergeOpt({
    proj: { dockerComposeVersion: '3' },
  }, overrides);
  mustBe.nest('project name', dd.proj.name);
  const partFiles = await scanDirs(dd);
  console.debug(partFiles);

}

export default recompose;
