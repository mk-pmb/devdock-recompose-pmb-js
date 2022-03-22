// -*- coding: utf-8, tab-width: 2 -*-

import getOrAddKey from 'getoraddkey-simple';
import getOwn from 'getown';
import ifFun from 'if-fun';
import mergeOpt from 'merge-options';
import mustBe from 'typechecks-pmb/must-be.js';
import objPop from 'objpop';
import crObAss from 'create-object-and-assign';
import pMapSeries from 'p-map-series';
import pEachSeries from 'p-each-series';
import vTry from 'vtry';

import scanDirs from './scanDirs.mjs';
import netFx from './netFx.mjs';
import svcFx from './svcFx.mjs';
import varSlotFx from './varSlotFx.mjs';



const EX = {};


function funAug(c, x) { return (ifFun(x) ? x(c.dd, c.meta) : x); }


const cfgStageNamesOrder = [
  'earlyCfg',
  'cfg',
  'lateCfg',
];


const stageParams = [
  ...cfgStageNamesOrder.map(t => ({ rootKeyTopic: t, mergeIntoTopic: 'cfg' })),
  // Stage 'cfg' will be run from topicOrder again, but at
  // that point, the 'cfg' rootKey will have been objPop-ped already.
  // Thus, the 2nd 'cfg' run will do nothing.
  ...scanDirs.topicOrder.map(t => ({ rootKeyTopic: t })),
];


function subCtx(a) { return crObAss(this, a); }


Object.assign(EX, {

  async allFiles(dd, partFiles) {
    function prep({ impl, ...meta }) { return EX.prepare(dd, meta, impl); }
    const ctxs = await pMapSeries(partFiles, prep);
    await pEachSeries(stageParams, function oneStage(param) {
      function oneFile(ctx) { return EX.learnStage(ctx, param); }
      return pEachSeries(ctxs, oneFile);
    });
    await pEachSeries(ctxs, EX.allStagesLearned);
  },


  async oneLateFile(dd, meta, spec) {
    const ctx = await EX.prepare(dd, meta, spec);
    await pEachSeries(stageParams, param => EX.learnStage(ctx, param));
    await EX.allStagesLearned(ctx);
  },


  async prepare(dd, meta, origRootSpec) {
    const ctx = { dd, meta, subCtx };
    const rsff = 'root spec from file ' + ctx.meta.file;
    const rootSpec = await vTry.pr(funAug, 'Generate ' + rsff,
    )(ctx, origRootSpec);
    if (!rootSpec) { return; }
    mustBe('obj', rsff)(rootSpec);
    // console.debug('fallible', meta, rootSpec);
    ctx.rootSpec = rootSpec;
    ctx.rootPop = objPop(rootSpec, { mustBe }).mustBe;
    ctx.fx = ctx.rootPop('obj | undef', 'FX option in ' + rsff) || {};
    vTry(EX.verifyFmt, 'Verify format of ' + rsff)(ctx);
    return ctx;
  },


  learnStage(ctx, param) {
    const descr = ('Learn section ' + ctx.rootKeyTopic
      + ' of file ' + ctx.meta.file);
    return vTry.pr(EX.rootKey, descr)(ctx.subCtx(param));
  },


  allStagesLearned(ctx) {
    return vTry.pr(EX.allStagesLearnedFallible,
      'After learning file ' + ctx.meta.file)(ctx);
  },


  allStagesLearnedFallible(ctx) {
    ctx.rootPop.expectEmpty('Unsupported top-level topic(s)');
  },


  verifyFmt(ctx) {
    const fmt = ctx.rootPop('str', 'FMT', '');
    if (ctx.meta.ignFmt) { return; }
    const keys = new Set(Object.keys(ctx.rootSpec));
    cfgStageNamesOrder.forEach(st => [keys.delete(st), keys.delete(st + 's')]);
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
    const rawName = (specPop('str | undef', 'NAME', origName) || '');
    const name = EX.maybeAddNamePrefix(rawName, origCtx.meta);
    const { rootKeyTopic } = origCtx;
    const ctx = origCtx.subCtx({ spec, specPop, name });

    // We can only render varSlotFx once we know our name,
    // because varSlotFx supports shorthands for using the name.
    // console.debug('before varSlotFx', { id: ctx.meta.idName, rootKeyTopic });
    await varSlotFx.renderInplace(ctx, spec);

    const mergeIntoTopic = (ctx.mergeIntoTopic || rootKeyTopic);
    const topicFx = getOwn(EX.topicKeyFx, mergeIntoTopic);
    if (topicFx) {
      spec = ((await topicFx(spec, ctx)) || spec);
      if (spec === 'SKIP') { return; }
    }

    const topicDict = getOrAddKey(ctx.dd, mergeIntoTopic, '{}');
    topicDict[name] = mergeOpt(topicDict[name], spec);
  },


  maybeAddNamePrefix(name, meta) {
    const s = String(name || '');
    const f = (s && s.slice(0, 1));
    const a = ((!f)
      || (f === '_')
      || (f === '-')
    );
    if (!a) { return s; }
    scanDirs.ensureFilenamePartsInplace(meta);
    return meta.idName + s;
  },


  topicKeyFx: {
    net: netFx,
    svc: svcFx,
  },


});


export default EX;
