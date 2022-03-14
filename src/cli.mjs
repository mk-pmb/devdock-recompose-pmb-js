// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import oppoHaxx from './oppoHaxx.mjs';
import re from './recompose.mjs';

const EX = {

  init() {
    const { env } = process;
    EX.proj = {
      name: (env.COMPOSE_PROJECT_NAME || ('unnamed_project_' + Date.now())),
      dir: (env.DEVDOCK_DIR || '.'),
    };
  },

  async main() {
    await oppoHaxx();
    await EX.waitBeforeMain;
    const dd = await re({ proj: EX.proj });
    const cft = dd.toComposeFile().text({ headAndTail: true });
    console.debug(cft.trim());
  },

};

EX.init();
EX.donePr = EX.main();

export default EX;
