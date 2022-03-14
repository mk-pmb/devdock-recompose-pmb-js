// -*- coding: utf-8, tab-width: 2 -*-

import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import yamlify from 'jsonbased-yamlify-pmb';


const {
  defaultHeaderLines,
  defaultFooterLines,
} = yamlify.util;


function countKeys(x) { return Object.keys(x || false).length; }

function cfToYaml(opt) {
  let y = yamlify(this.content);
  if (!opt) { return y; }
  if (opt.headAndTail) { y = defaultHeaderLines + y + defaultFooterLines; }
  return y;
}


function toComposeFile() {
  const dd = this;
  const popSect = objPop(dd, { mustBe }).mustBe;
  const proj = popSect('obj', 'proj');
  const content = {
    version: proj.composeFileFormat,
  };

  function addSect(s, d) { if (countKeys(d)) { content[s] = d; } }
  popSect('obj | undef', 'cfg');
  addSect('networks', popSect('obj | undef', 'net'));
  addSect('services', popSect('obj | undef', 'svc'));
  Object.keys(dd).forEach((k) => {
    if (k.match(/^to[A-Z]/)) { return popSect('fun', k); }
  });
  popSect.expectEmpty('Left-over top-level topic(s)');

  const cf = {
    dd,
    content,
    text: cfToYaml,
  };
  return cf;
}

export default toComposeFile;
