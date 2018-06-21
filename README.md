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
  litenode [-H|--help]
  litenode [-V|--version]
  litenode [-p|--port <num>] [--dbpath <string>] [peer1 [peer2 [...]]]

Options:
  -p, --port     Specify port daemon will listen on     [number] [default: 1113]
  --dbpath       Specify path where data will be stored                 [string]
  -H, --help     Show help                                             [boolean]
  -V, --version  Show version number                                   [boolean]

Examples:
  litenode --port 1113 ws://192.168.0.217:1113
  litenode --dbpath /path/db/directory ws://192.168.0.217:2113

Also see https://github.com/bidiu/litemessage
```

- liteclient
```
$ liteclient --help
Usages:
  liteclient [-H|--help]
  liteclient [-V|--version]
  liteclient [-p|--port <num>] peer1 [peer2 [...]] message

Options:
  -p, --port     Specify port daemon will listen on     [number] [default: 2107]
  -H, --help     Show help                                             [boolean]
  -V, --version  Show version number                                   [boolean]

Examples:
  liteclient --port 2107 ws://192.168.0.217:1113 "hello, world"

Also see https://github.com/bidiu/litemessage
```
