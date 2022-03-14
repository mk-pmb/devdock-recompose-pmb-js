// -*- coding: utf-8, tab-width: 2 -*-

import getOrAddKey from 'getoraddkey-simple';
import getOwn from 'getown';
import ifFun from 'if-fun';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';

import scanDirs from './scanDirs.mjs';
import netFx from './netFx.mjs';
import svcFx from './svcFx.mjs';


const EX = async function learn(dd, meta, spec) {
  return vTry.pr(EX.fallible, 'Learn file ' + meta.file)(dd, meta, spec);
};

function funAug(c, x) { return (ifFun(x) ? x(c.dd, c.meta) : x); }


Object.assign(EX, {

  async fallible(dd, meta, origRootSpec) {
    const ctx = { dd, meta };
    const rootSpec = await funAug(ctx, origRootSpec);
    if (!rootSpec) { return; }
    mustBe('obj', 'root config')(rootSpec);
    // console.debug('fallible', meta, rootSpec);
    ctx.rootSpec = rootSpec;
    ctx.rootPop = objPop(rootSpec, { mustBe }).mustBe;
    EX.verifyFmt(ctx);
    await pEachSeries(scanDirs.topicOrder,
      t => EX.rootKey({ ...ctx, rootKeyTopic: t }));
    ctx.rootPop.expectEmpty('Unsupported top-level topic(s)');
  },


  verifyFmt(ctx) {
    const fmt = ctx.rootPop('str', 'FMT', '');
    if (ctx.meta.ignFmt) { return; }
    const keys = new Set(Object.keys(ctx.rootSpec));
    keys.delete('cfg');
    keys.delete('cfgs');
    if (keys.size === 0) { return; }
    mustBe([['eeq', ctx.dd.proj.composeFileFormat]],
      'FMT === composeFileFormat expected by project')(fmt);
  },


  async rootKey(ctx) {
    function rootAug(suf) {
      return funAug(ctx,
        ctx.rootPop('obj | fun | undef', ctx.rootKeyTopic + suf));
    }
    const singleSpec = await rootAug('');
    const multi = await rootAug('s');
    const nameSpecPairs = [
      ['', singleSpec],
      ...Object.entries(multi || false),
    ];
    // console.debug('rootKey', ctx.meta.file, nameSpecPairs);
    await pEachSeries(nameSpecPairs,
      ([name, spec]) => EX.oneTopicKeySpec(ctx, name, spec));
  },


  async oneTopicKeySpec(origCtx, origName, origSpec) {
    if (!origSpec) { return; }
    let spec = { ...origSpec };
    const specPop = objPop.d(spec, { mustBe }).mustBe;

    let name = (specPop('str | undef', 'NAME', origName) || '');
    if ((!name) || name.startsWith('_')) {
      const { meta } = origCtx;
      scanDirs.ensureFilenamePartsInplace(meta);
      name = meta.idName + name;
    }

    const ctx = {
      ...origCtx,
      name,
      specPop,
    };
    // console.debug('oneTopicKeySpec', { ...ctx, dd: 0 }, spec);

    const { rootKeyTopic } = ctx;
    const fx = getOwn(EX.topicKeyFx, rootKeyTopic);
    if (fx) {
      spec = ((await fx(spec, ctx)) || spec);
      if (spec === 'SKIP') { return; }
    }

    const topicDict = getOrAddKey(ctx.dd, rootKeyTopic, '{}');
    topicDict[name] = mergeOpt(topicDict[name], spec);
  },


  topicKeyFx: {
    net: netFx,
    svc: svcFx,
  },


});


export default EX;
