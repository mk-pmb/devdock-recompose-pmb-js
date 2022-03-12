// -*- coding: utf-8, tab-width: 2 -*-

import 'p-fatal';
import 'usnam-pmb';

import re from './recompose.mjs';

const { env } = process;

const proj = {
  name: (env.COMPOSE_PROJECT_NAME || ('unnamed_project_' + Date.now())),
  dir: (env.DEVDOCK_DIR || '.'),
};

re({ proj });
