// -*- coding: utf-8, tab-width: 2 -*-

import getOrAddKey from 'getoraddkey-simple';
import kebabCase from 'just-kebab-case'; // lodash.kebabcase('a1') = 'a-1'

import kisi from './kitchenSink.lib.mjs';

const {
  refineInplace,
  flattenEllipsisKeysInplace,
} = kisi;


function trimIf(s) { return (s && String(s).trim()); }


const EX = function svcFx(spec, ctx) {
  refineInplace(spec, 'command', trimIf);
  refineInplace(spec, 'hostname', EX.hostnameKebab, ctx);
  refineInplace(spec, 'restart', EX.translateRestart);
  EX.maybeLocalhostPorts(spec, ctx);
  EX.envFx(spec.environment);
};


Object.assign(EX, {

  translateRestart(o) {
    if (o === true) { return 'always'; }
    if (o === false) { return 'no'; }
    if (o === 'never') { return 'no'; }
    return (o || 'always');
  },

  hostnameKebab(custom, ctx) {
    if (custom !== undefined) { return; }
    const svcName = ctx.name;
    if (!svcName) { return; }
    const k = kebabCase(svcName);
    if (k === svcName) { return; }
    return k;
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

  envFx(env) {
    if (!env) { return; }
    flattenEllipsisKeysInplace(env);
    // eslint-disable-next-line no-param-reassign
    Object.keys(env).forEach(k => ((env[k] === null) && (delete env[k])));
  },


});

export default EX;
