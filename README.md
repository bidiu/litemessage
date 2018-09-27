# litemessage

This project is both a node client supporting "full" & "thin" modes, similar to Bitcoin, and also a library for developing in both browser and Node.js.

## As a library
When used as a library, it exports many necessary classes such as `LiteNode`, `FullNode`, `ThinNode`, and also many utilities including `Blockchain` and crypto primitive implementations used by litemessage.

### Used in browser
The easiest way to use this library in browser is by including this CDN link:
```
<script src="https://unpkg.com/litemessage@latest/dist/litemessage.umd.min.js"></script>
```

Then a `litemessage` object will be attached to `window`, or `self` if you are using it in WebWorker. For instance:
```
// start a node in browser
let node = new litemessage.ThinNode('IndexedDB_scope', { initPeerUrls: ['ws://litemessage.com:1113'] });
```

### Used with package manager
When using npm, you can install it by:
```
npm install --save litemessage
```

If developing for Node.js, require it by:
```
const { FullNode } = require('litemessage');

// or when you are using webpack
import { FullNode } from 'litemessage';
```

When building for browser environment, you must require it this way (you should use a bundler such as webpack):
```
import { FullNode } from 'litemessage/dist/litemessage.umd.min';
```

> API documentation is on its way.

## As a client
### Install with npm
```
npm install -g litemessage
```

### Run with docker
You can also install and run it with docker. To run it with docker:
```
docker container run --name name_of_you_choice -d --rm -p 1113:1113 bidiubiu/litemessage
```

To stop and delete the container (note the `--rm` from above):
```
docker container stop name_of_you_choice
```

If you run and stop this way, blockchain data will be wiped out along with the container. To avoid that, you can use volume:
```
docker container run ... -v volume_name_you_choose:/root/.litemsg ...
```

The default command of the image is `litenode` with all default options (no initial peers specified). To run `spvnode` (see next) or with custom options, you can override everything when you run the container:
```
docker container run --name name_of_you_choice -d --rm -p 1113:1113 bidiubiu/litemessage [litenode|spvnode] [your custom options here]
```

Check [bidiubiu/litemessage tags](https://hub.docker.com/r/bidiubiu/litemessage/tags/) for available tags.

### Usages
By running `litenode`, you will join the peer-to-peer network. One of the official node's IP is `45.79.182.46` (`litemessage.com`), its port is `1113`.

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

`litenode` is the full node client, which will fetch the entire blockchain and do verification locally. There's another type of client `spvnode`, which only fetches the block headers. For usage:
```
spvnode --help
```

## License
MIT
