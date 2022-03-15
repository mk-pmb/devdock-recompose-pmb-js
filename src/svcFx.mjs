// -*- coding: utf-8, tab-width: 2 -*-

import getOrAddKey from 'getoraddkey-simple';

import kisi from './kitchenSink.lib.mjs';

const {
  refineInplace,
  flattenEllipsisKeysInplace,
} = kisi;


const EX = function svcFx(spec, ctx) {
  refineInplace(spec, 'command', s => (s && String(s).trim()));
  refineInplace(spec, 'restart', EX.translateRestart);
  EX.maybeLocalhostPorts(spec, ctx);
  flattenEllipsisKeysInplace(spec.environment);
};


Object.assign(EX, {

  translateRestart(o) {
    if (o === true) { return 'always'; }
    if (o === false) { return 'no'; }
    if (o === 'never') { return 'no'; }
    return (o || 'always');
  },

  maybeLocalhostPorts(spec, ctx) {
    const lhp = ctx.specPop('ary | undef', 'lhports');
    if (!lhp) { return; }
    const ports = getOrAddKey(spec, 'ports', '[]');
    lhp.forEach(function add(orig) {
      if (!orig) { return; }
      let p = String(orig);
      if (!p.includes(':')) { p += ':' + p; }
      ports.push('127.0.0.1:' + p);
    });
  },


});

export default EX;
