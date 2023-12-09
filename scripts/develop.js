/**
 * This file is part of Feather Wiki.
 *
 * Feather Wiki is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * Feather Wiki is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with Feather Wiki. If not, see https://www.gnu.org/licenses/.
 */
import path from 'path';
import fs from 'fs';
import http from 'http';
import esbuild from 'esbuild';
import express from 'express';

const outputDir = path.resolve(process.cwd(), 'develop');
const outputFilePath = path.resolve(outputDir, 'index.html');

esbuild.build({
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
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else {
        handleBuildResult(result)
          .catch((e) => {
            console.error(e);
            process.exit(1);
          });
      }
    },
  },
  plugins: [],
  platform: 'browser',
  format: 'iife',
  target: [ 'es2015' ],
  outdir: 'build',
})
  .then(handleBuildResult)
  .then(startServer)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

async function handleBuildResult (result) {
  const fileName = path.relative(process.cwd(), 'index.html');
  let html = await fs.promises.readFile(fileName, 'utf8');
  const cssResult = esbuild.buildSync({
    entryPoints: ['index.css'],
    write: false,
    bundle: true,
    minify: false,
    outdir: 'build',
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
async function startServer () {
  const app = express()
  const port = 3000

  app.use(express.static('develop'))

  app.put('*', (req, res) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const outputDir = path.resolve(process.cwd(), 'develop');
      let fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
      const url = new URL(fullUrl);
      const filePath = path.join(outputDir, url.pathname === "/" ? 'index.html' : url.pathname);

      fs.writeFile(filePath, body, (err) => {
        if (err) throw err;
        console.log('Saved!');
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'PUT, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Content-Length, X-Requested-With',
          'dav': '1',
        });
        res.end("saved");
      });
    });
  });

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

async function startServer2 () {
  const server = http.createServer((req, res) => {
    if (req.method == 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Content-Length, X-Requested-With',
        'dav': '1',
      });
      res.end();
    }
    else if (req.method == 'PUT') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        let filePath = path.join(outputDir, req.url);
        const exists = fs.existsSync(filePath);
        if (!exists){
          filePath = outputFilePath;
        }

        fs.writeFile(filePath, body, (err) => {
          if (err) throw err;
          console.log('Saved!');
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Content-Length, X-Requested-With',
            'dav': '1',
          });
          res.end("saved");
        });
      });
    }
    else if (req.method == 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        // Process the body here
        console.log('Received body:', body);
        if (body == 'OPTIONS') {
          res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Content-Length, X-Requested-With',
            'dav': '1',
          });
        }
        res.end();
      });
    }
    else {
      const filePath = path.join(outputDir, req.url);

      const exists = fs.existsSync(filePath);
      if (exists){
        const ext = path.extname(filePath);
        if (ext === '.html') res.writeHead(200, { 'Content-Type': 'text/html' });
        else if (ext === '.js') res.writeHead(200, { 'Content-Type': 'text/javascript; charset=UTF-8' });
        res.end(fs.readFileSync(filePath));  
      }
      else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(outputFilePath));
      }
    }
  });
  server.listen(3000, 'localhost');
  console.log('Node server running at http://localhost:3000');
}
