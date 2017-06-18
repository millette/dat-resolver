'use strict'

const datKeyM = (path, ctx, key) => ctx.datLru.get(key)
  .then((dat) => {
    ctx.etag = `version-${dat.version}`
    ctx.type = 'application/json'
    ctx.body = dat.archive.createReadStream(`/${path}`)
  })
  .catch((e) => ctx.throw(404, e))

const top = (ctx, key) => ctx.datLru.get(key)
  .then((dat) => {
    ctx.etag = `version-${dat.version}`
    return dat.archive.readdir('/')
  })
  .then((files) => {
    ctx.type = 'application/json'
    ctx.body = { files }
  })
  .catch((e) => ctx.throw(404, e))

const home = async (ctx) => {
  ctx.type = 'text/html'
  ctx.body = `<!doctype html>
<html>
<head>
<meta charset='utf-8'>
<title>About dat-resolver</title>
</head>
<body>
<h1>About dat-resolver</h1>
<h2>Available API endpoints</h2>
<ol>
  <li><code>/top/:datkey</code></li>
  <li><code>/resolve/:datkey</code></li>
  <li><code>/profile/:datkey</code></li>
  <li><code>/manifest/:datkey</code></li>
</ol>

<h3>Examples</h2>
<ol>
  <li><a href="/top/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4">/top/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4</a></li>
  <li><a href="/resolve/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4">/resolve/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4</a></li>
  <li><a href="/profile/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4">/profile/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4</a></li>
  <li><a href="/manifest/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4">/manifest/26620b74b6878c872ff243a151974aad5d52349bda12a02c19098421fce8bef4</a></li>
</ol>

</body>
</html>
`
}

module.exports = { top, datKeyM, home }
