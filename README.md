[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/firebase/emulators-codelab)

## How to use this repository

This repository is meant to be used with the [Firestore and Functions Emulator
Codelab]().

There are two folders in this respository, `codelab-starting-state` and
`codelab-final-state`. To walk through the codelab, clone down the project,
`git clone github.com/firebase/emulators-codelab`, `cd codelab-starting-state`,
and then follow along with the [codelab steps](). To see the front end,
functions, or security rules, written in the codelab, cd into
`codelab-final-state`, instead.


## How to make contributions?
Please read and follow the steps in the [CONTRIBUTING.md](CONTRIBUTING.md)


## License
See [LICENSE](LICENSE)

## steps:

    $ cd codelab-initial-state/
    $ cd functions && npm install && cd -
    $ npm install -g firebase-tools
    $ firebase --version
    $ firebase login --no-localhost
    $ firebase projects:list
    $ firebase use --add
    $ firebase emulators:start

