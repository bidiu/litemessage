# litemessage

This project is both a node client supporting "full" & "thin" modes, similar to Bitcoin, and also a library for developing in both browser and Node.js.

## As a library
When used as a library, it exports many necessary classes such as `FullNode`, `ThinNode`, and also many utilities including `Blockchain` and crypto utils.

### Used in browser
The easiest way to use this library in browser is by including the CDN link
```
<script src="https://unpkg.com/litemessage@0.10.7/dist/litemessage.umd.min.js"></script>
```

### Used with package manager
When using npm, you can install it by
```
npm install --save litemessage
```

If developing for Node.js, require it by
```
const { FullNode } = require('litemessage');

// or when you are using webpack
import { FullNode } from 'litemessage';
```

When building for browser environment, you must require it this way (you should use a bundler such as webpack)
```
import { FullNode } from 'litemessage/dist/litemessage.umd.min';
```

## As a client
### Install
```
npm install -g litemessage
```

### Usages
By running `litenode`, you will join the peer-to-peer network.

```
$ litenode --help

Usages:
  litenode.js [-H|--help]
  litenode.js [-V|--version]
  litenode.js [-p|--port <num>] [--dbpath <str>] [-D|--debug [true|false]] [peer1 [peer2 [...]]]

Options:
  -p, --port     Specify port daemon will listen on                         [number] [default: 1113]
  --dbpath       Specify path where data will be stored                                     [string]
  -D, --debug    Enable debugging RESTful API server                                       [boolean]
  -H, --help     Show help                                                                 [boolean]
  -V, --version  Show version number                                                       [boolean]

Examples:
  litenode.js --port 1113 ws://192.168.0.217:1113
  litenode.js --dbpath /path/db/directory ws://192.168.0.217:2113

Also see https://github.com/bidiu/litemessage
```

> `litenode` is the full node client, which will fetch the entire blockchain and do verification locally. There's another type of client `spvnode`, which only fetches the block headers. For usage: `spvnode --help`.
