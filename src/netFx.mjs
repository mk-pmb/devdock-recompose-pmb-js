// -*- coding: utf-8, tab-width: 2 -*-

import getOrAddKey from 'getoraddkey-simple';

const EX = function netFx(spec, ctx) {
  EX.maybeBridge(spec, ctx);
};


Object.assign(EX, {

  maybeBridge(spec, ctx) {
    const br = ctx.specPop('obj | eeq:true | undef', 'BRIDGE');
    if (!br) { return; }
    spec.type = 'bridge'; // eslint-disable-line no-param-reassign
    const ent = Object.entries(br);
    if (!ent.length) { return; }
    const prfx = 'com.docker.network.bridge.';
    // https://docs.docker.com/engine/reference/commandline/network_create/
    const drOpt = getOrAddKey(spec, 'driver_opts', '{}');
    ent.forEach(([k, v]) => { drOpt[prfx + k] = v; });
  },


});

export default EX;
