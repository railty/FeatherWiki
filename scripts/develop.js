import path from 'path';
import fs from 'fs';
import esbuild from 'esbuild';
import { text } from 'express';

const outputDir = path.resolve(process.cwd(), 'develop');
const outputFilePath = path.resolve(outputDir, 'index.html');

const main = async ()=>{
  const result = await esbuild.build({
    entryPoints: ['index.js'],
    define: {
      'process.env.NODE_ENV': '"development"',
      'process.env.NODE_DEBUG': '"debug"',
      'process.env.SERVER': 'true',
    },
    sourcemap: 'inline',
    write: false,
    bundle: true,
    minify: false,
    plugins: [],
    platform: 'browser',
    format: 'iife',
    target: [ 'es2015' ],
    outdir: 'develop',
    logLevel: 'info',
  });

  const js = new TextDecoder().decode(result.outputFiles[0].contents);
  const css = new TextDecoder().decode(result.outputFiles[1].contents);
  
  console.log(css);

  const fileName = path.relative(process.cwd(), 'index.html');
  let html = await fs.promises.readFile(fileName, 'utf8');

  html = html.replace('{{cssOutput}}', css);
  html = html.replace('{{jsOutput}}', js);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  await fs.writeFileSync(outputFilePath, html);
}

const funcCss = async ()=>{
  const cssResult = await esbuild.build({
    entryPoints: ['index.css', 'node_modules/gfm.css/gfm.css'],
    write: false,
    bundle: true,
    minify: false,
    outdir: 'builds',
  });

  console.log(cssResult);
}
//funcCss();
main();


/*
  .then(handleBuildResult)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

async function handleBuildResult (result) {
  const fileName = path.relative(process.cwd(), 'index.html');
  let html = await fs.promises.readFile(fileName, 'utf8');
  const cssResult = esbuild.buildSync({
    entryPoints: ['index.css', 'node_modules/gfm.css/gfm.css'],
    write: false,
    bundle: true,
    minify: false,
    outdir: 'builds',
  });
  for (const out of [...cssResult.outputFiles, ...result.outputFiles]) {
    let output = new TextDecoder().decode(out.contents);
    const outputKb = out.contents.byteLength * 0.000977;
    console.info(out.path, outputKb.toFixed(3) + ' kilobytes');
    if (/\.css$/.test(out.path)) {
      html = html.replace('{{cssOutput}}', output);
    } else if (/\.js$/.test(out.path)) {
      // Since there's regex stuff in here, I can't do replace!
      const htmlParts = html.split('{{jsOutput}}'); // But this does exactly what I need
      html = htmlParts[0] + output + htmlParts[1];
    }
  }
  
  return injectPackageJsonData(html);
}

async function injectPackageJsonData (html) {
  const fileName = path.relative(process.cwd(), 'package.json');
  const packageJsonFile = await fs.promises.readFile(fileName, 'utf8');
  const packageJson = JSON.parse(packageJsonFile);

  const matches = html.match(/(?<={{)package\.json:.+?(?=}})/g);

  if (matches?.length > 0) {
    let result = html;
    matches.map(match => {
      const value = match.replace('package.json:', '').trim();
      const replace = value.split('.').reduce((result, current) => {
        if (result === null) {
          return packageJson[current] ?? '';
        }
        return result[current] ?? '';
      }, null);
      return {
        match: `{{${match}}}`,
        replace,
      };
    }).forEach(m => {
      html = html.replace(m.match, m.replace);
    });
  }

  return writeHtmlOutput(html);
}

async function writeHtmlOutput (html) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  await fs.writeFile(outputFilePath, html, (err) => {
    if (err) throw err;
    const outputKb = Uint8Array.from(Buffer.from(html)).byteLength * 0.000977;
    console.info(outputFilePath, outputKb.toFixed(3) + ' kilobytes');
  });
}
*/