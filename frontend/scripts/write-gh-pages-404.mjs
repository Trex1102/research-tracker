import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { loadEnv } from 'vite'

function normalizeBasePath(basePath) {
  if (!basePath || basePath === '/') return '/'
  return `/${basePath.replace(/^\/+|\/+$/g, '')}/`
}

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '')
const basePath = normalizeBasePath(process.env.VITE_BASE_PATH || env.VITE_BASE_PATH || '/')
const segmentCount = basePath === '/' ? 0 : basePath.split('/').filter(Boolean).length
const distDir = path.resolve(process.cwd(), 'dist')
const outputPath = path.join(distDir, '404.html')

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Research Tracker</title>
  <script>
    // GitHub Pages SPA redirect hack.
    // The segment count depends on whether the app is deployed at the root
    // domain or under a repository subpath.
    var segmentCount = ${segmentCount};
    var l = window.location;
    l.replace(
      l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
      l.pathname.split('/').slice(0, 1 + segmentCount).join('/') + '/?/' +
      l.pathname.slice(1).split('/').slice(segmentCount).join('/').replace(/&/g, '~and~') +
      (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
      l.hash
    );
  </script>
</head>
<body></body>
</html>
`

await mkdir(distDir, { recursive: true })
await writeFile(outputPath, html, 'utf8')
