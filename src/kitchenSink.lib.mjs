// -*- coding: utf-8, tab-width: 2 -*-

const kisi = {

  refineInplace(o, k, f) {
    const n = f(o[k]);
    if (n === undefined) { return; }
    o[k] = n; // eslint-disable-line no-param-reassign
    return n;
  },


};

export default kisi;
