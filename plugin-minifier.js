'use strict';

module.exports = async function(pluginConf, web) {

  // TODO: handle in framework
  Object.assign(pluginConf, Object.assign(require('./conf/conf.js'), pluginConf));

  if (web.conf.isProd && !pluginConf.runInProd) {
    console.warn("Skipping minifier in prod because of configuration.");
    return;
  }


  const path = require('path');
  const minify = require('minify');
  const fs = require('fs-extra');
  const util = require('util');
  const writeFileProm = util.promisify(fs.writeFile);
  const readFileProm = util.promisify(fs.readFile);
  const ensureFileProm = util.promisify(fs.ensureFile);
  const pathExistsProm = util.promisify(fs.pathExists);
  const removeProm = util.promisify(fs.remove);
  const crc32 = require('fast-crc32c');

  for (let filePath in pluginConf.minify) {
    let fileConf = pluginConf.minify[filePath] || {};

    if (fileConf.enabled === undefined || fileConf.enabled) {
      let minifyPath = fileConf.path || getDefaultMinifyPath(filePath);
      let fullMinifyPath = path.join(web.conf.baseDir, minifyPath);

      let fullFilePath = path.join(web.conf.baseDir, filePath);
      try {
     
        let fileCrc = crc32.calculate(await readFileProm(fullFilePath));

        let tmpPath = path.join(web.conf.baseDir, web.conf.tmpDir, "oils-plugin-minifier");
        let fullCrcPath = path.join(tmpPath, filePath, fileCrc.toString());
   
        // stops from minifying if already minified
        if (!(await pathExistsProm(fullCrcPath))) {
          let content = await minify(fullFilePath, pluginConf.opts);
          // TODO: upgrade minify, but also needs node js >= 14
          // TODO: in the latest version of minify, this can be streamified. Upgrade when node js >= 14
        
          await writeFileProm(fullMinifyPath, content);
          await removeProm(path.dirname(fullCrcPath));
          await ensureFileProm(fullCrcPath);
          console.log("Minified " + filePath + " to " + minifyPath);
        }

      } catch (err) {
        console.error("Error minfiying:", err);
      }


    }
  }


  function getDefaultMinifyPath(filePath) {
    let ext = path.extname(filePath);
    let iExt = filePath.lastIndexOf(ext);
    return filePath.substring(0, iExt) + '.min' + ext;
  }
}

