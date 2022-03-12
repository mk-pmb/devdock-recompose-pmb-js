// -*- coding: utf-8, tab-width: 2 -*-

// import ifFun from 'if-fun';
import fsPr from 'fs/promises';
import pathLib from 'path';
import pMapSeries from 'p-map-series';
import readDataFile from 'read-data-file';
import vTry from 'vtry';


async function relModuleImport(path) {
  return (await import(pathLib.resolve(path))).default;
}


const EX = async function scanDirs(dd) {
  const projDir = dd.proj.dir;
  const found = [].concat(...await pMapSeries(EX.categOrder,
    c => EX.scanFilesInOneDir(pathLib.join(projDir, c + '.enabled'))));
  return found;
};


Object.assign(EX, {

  categOrder: [
    'cfg',
    'net',
    'svc',
  ],

  simpleConfigFexts: Object.keys(readDataFile.parsersByFext),

  async scanFilesInOneDir(enabDir) {
    const allFileNames = await fsPr.readdir(enabDir);
    // ^- Unfortunately, we cannot use { withFileTypes: true }  in
    //    node v16.14.0 because the .isFile method of its dirEnts
    //    will return false for symlinks that point to a regular file.
    //    Work-around: (await fsPr.stat(path)).isFile() works.
    const notHidden = allFileNames.filter(n => !n.startsWith('.'));
    notHidden.sort();
    const imported = await pMapSeries(notHidden,
      n => EX.importOneEnabFile(pathLib.join(enabDir, n)));
    return imported.filter(Boolean);
  },

  decideImportMethodByFext(fext) {
    if (EX.simpleConfigFexts.includes(fext)) { return readDataFile; }
    if (fext === 'mjs') { return relModuleImport; }
    return false;
  },

  async importOneEnabFile(efPath) {
    const efBaseName = pathLib.basename(efPath);
    const efExt = (/\.(\w+)$/.exec(efBaseName) || false)[1];
    const importer = EX.decideImportMethodByFext(efExt);
    if (!importer) { return false; }
    const imp = await vTry(importer, 'Import file ' + efPath)(efPath);
    return (imp && { file: efPath, imp });
  },


});


export default EX;
