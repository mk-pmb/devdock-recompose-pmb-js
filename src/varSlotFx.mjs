// -*- coding: utf-8, tab-width: 2 -*-

import objDive from 'objdive';
import pEachSeries from 'p-each-series';


const EX = {

  startTrace(rootDescr) {
    const emptyTrace = new Set();
    const path = [];
    if (rootDescr) { path.push(rootDescr); }
    emptyTrace.path = path;
    return emptyTrace;
  },

  async renderInplace(ctx, spec, trace) {
    if (!spec) { return; }
    if (!(trace || false).path) {
      return EX.renderInplace(ctx, spec, EX.startTrace(trace));
    }
    if (trace.has(spec)) { return; }
    trace.add(spec);

    const origKeys = Object.keys(spec).sort();
    const updates = {};
    const deletes = new Set();
    const nKeys = origKeys.length;
    if (!nKeys) { return; }
    const singleKey = ((nKeys === 1) && nKeys[0]);
    if (singleKey === 'Ð') { throw new Error('Ð object not supported yet.'); }

    await pEachSeries(origKeys, async function maybeInsertVars(origKey) {
      const key = await EX.renderStr(ctx, trace, origKey);
      const origVal = spec[origKey];
      const val = await EX.renderVal(ctx, trace, origKey, origVal);
      const renamed = (key !== origKey);
      if (renamed) { deletes.add(origKey); }
      if (renamed || (val !== origVal)) { updates[key] = val; }
    });

    // eslint-disable-next-line no-param-reassign
    deletes.forEach(function del(key) { delete spec[key]; });
    Object.assign(spec, updates);
    trace.delete(spec);
  },


  async renderVal(ctx, trace, key, val) {
    const vt = (val && typeof val);
    if (vt === 'string') { return EX.renderStr(ctx, trace, val); }
    if (vt === 'object') {
      trace.path.push(key);
      await EX.renderInplace(ctx, val, trace);
      trace.path.pop();
    }
    return val;
  },


  async renderStr(ctx, trace, origStr) {
    const parts = origStr.split(/Ð<([^<>]*)>/);
    const nParts = parts.length;
    if (nParts < 2) { return origStr; }
    await pEachSeries(parts, async function renderUnevenParts(slotSpec, idx) {
      if (idx % 2) {
        const slotNum = (idx + 1) / 2;
        parts[idx] = await EX.renderSlot(ctx, trace, slotSpec, slotNum);
      }
    });
    if ((nParts === 3) && (!parts[0]) && (!parts[2])) { return parts[1]; }
    return parts.join('');
  },

  async renderSlot(ctx, trace, origSlotSpec, slotNum) {
    let ss = origSlotSpec;
    ss = ss.replace(/\^/g, ctx.name);
    const val = objDive(ctx.dd, ss);
    if (val === undefined) {
      console.debug('Current dd state:', ctx.dd);
      const msg = ('Variable lookup failed: '
        + [...trace.path, 'slot #' + slotNum].join(' → ')
        + ' = Ð<' + origSlotSpec + '>');
      throw new Error(msg);
    }
    return val;
  },

};

export default EX;
