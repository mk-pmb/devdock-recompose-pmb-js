// -*- coding: utf-8, tab-width: 2 -*-

import is from 'typechecks-pmb';


function flattenEllipsisKeysInplace(x) {
  if (!is.obj(x)) { return; }
  Object.entries(x).forEach(function foundKey([key, val]) {
    // Always delete and re-insert, to keep the ordering of keys.
    delete x[key]; // eslint-disable-line no-param-reassign

    // Diving while x[key] is deleted has the nice side-effect of
    // breaking potential recursion in some easy cases.
    flattenEllipsisKeysInplace(val);

    const parts = is.obj(val) && key.split('…');
    const expandKeys = (parts && (parts.length >= 2));
    if (!expandKeys) {
      // Just insert back the original.
      x[key] = val; // eslint-disable-line no-param-reassign
      return;
    }

    Object.entries(val).forEach(function assign([subKey, subVal]) {
      const dest = parts.join(subKey);
      x[dest] = subVal; // eslint-disable-line no-param-reassign
    });
  });
}



const kisi = {

  refineInplace(o, k, f, a) {
    const n = f(o[k], (a || o));
    if (n === undefined) { return; }
    o[k] = n; // eslint-disable-line no-param-reassign
    return n;
  },


  flattenEllipsisKeysInplace,

};

export default kisi;
