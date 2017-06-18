# Dat Resolver

A simple http interface to [dat][] with an API to retrieve meta data.

## Available flags

* port: set port, defaults to 3030
* host: set host (127.0.0.1, 0.0.0.0), defaults to 127.0.0.1
* lru: size of last recently used cache, defaults to 15
* fs: set to use filesystem, otherwise memory only

## Available API

* /top/:datkey (only available with fs flag)
* /resolve/:datkey
* /profile/:datkey
* /manifest/:datkey

### top
List top-level dat content.

### resolve
Fetch dat.json from dat.

### profile
Fetch profile.json from dat.

### manifest
Fetch manifest.json from dat.

## Requirements
Node 8 is required.

Built with [koa][] and [dat-node][].


[koa]: <http://koajs.com/>
[dat-node]: <https://github.com/datproject/dat-node>
[dat]: <https://datproject.org/>
