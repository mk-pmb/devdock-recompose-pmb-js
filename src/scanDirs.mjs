// -*- coding: utf-8, tab-width: 2 -*-

import fsPr from 'fs/promises';
import pAllay from 'p-allay';
import pathLib from 'path';
import pMapSeries from 'p-map-series';
import readDataFile from 'read-data-file';
import vTry from 'vtry';


async function relModuleImport(path) {
  return (await import(pathLib.resolve(path))).default;
}


const EX = async function scanDirs(dd) {
  const projDir = dd.proj.dir;
  const one = EX.scanFilesInOneDir;
  const found = [].concat(...await pMapSeries(EX.topicOrder, t => one({
    subdirTopic: t,
    enabDir: pathLib.join(projDir, t + '.enabled'),
  })));
  return found;
};


Object.assign(EX, {

  topicOrder: [
    'cfg',
    'net',
    'svc',
  ],

  simpleConfigFexts: Object.keys(readDataFile.parsersByFext),

  async scanFilesInOneDir(meta) {
    const { enabDir } = meta;
    const allFileNames = await pAllay.eNoEnt(fsPr.readdir(enabDir));
    // ^- Unfortunately, we cannot use { withFileTypes: true }  in
    //    node v16.14.0 because the .isFile method of its dirEnts
    //    will return false for symlinks that point to a regular file.
    //    Work-around: (await fsPr.stat(path)).isFile() works.
    if (!allFileNames) { return []; }
    const notHidden = allFileNames.filter(n => !n.startsWith('.'));
    notHidden.sort();
    const imported = await pMapSeries(notHidden,
      n => EX.importOneEnabFile({ ...meta, file: pathLib.join(enabDir, n) }));
    return imported.filter(Boolean);
  },

  decideImportMethodByFext(fext) {
    if (EX.simpleConfigFexts.includes(fext)) { return readDataFile; }
    if (fext === 'mjs') { return relModuleImport; }
    return false;
  },

  async importOneEnabFile(meta) {
    EX.ensureFilenamePartsInplace(meta);
    const importer = EX.decideImportMethodByFext(meta.fext);
    if (!importer) { return false; }
    const impl = await vTry(importer, 'Import file ' + meta.file)(meta.file);
    return (impl && { ...meta, impl });
  },

  ensureFilenamePartsInplace(meta) {
    if (meta.basename === undefined) {
      // eslint-disable-next-line no-param-reassign
      meta.basename = pathLib.basename(meta.file);
    }
    if (meta.fext === undefined) {
      // eslint-disable-next-line no-param-reassign
      meta.fext = ((/\.(\w+)$/.exec(meta.basename) || false)[1] || '');
    }
    if (meta.idName === undefined) {
      let n = meta.basename;
      n = n.replace(/\.\w+$/, '');
      n = n.replace(/(?:[\._](?:tmp))$/, '');
      n = n.replace(/^(?:(?:tmp|\d+)[\._\-])/, '');
      // eslint-disable-next-line no-param-reassign
      meta.idName = n;
    }
  },

});


export default EX;
