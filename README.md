## Litemessage

#### Install
```
npm install -g litemessage
```

#### Usages
- litenode
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

- liteclient
```
$ liteclient --help

Usages:
  liteclient.js [-H|--help]
  liteclient.js [-V|--version]
  liteclient.js [-p|--port <num>] [-D|--debug [true|false]] peer1 [peer2 [...]] message

Options:
  -p, --port     Specify port daemon will listen on                         [number] [default: 2107]
  -D, --debug    Enable debugging RESTful API server                                       [boolean]
  -H, --help     Show help                                                                 [boolean]
  -V, --version  Show version number                                                       [boolean]

Examples:
  liteclient.js --port 2107 ws://192.168.0.217:1113 "hello, world"

Also see https://github.com/bidiu/litemessage
```
