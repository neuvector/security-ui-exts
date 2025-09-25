# security-ui-exts

### Development environment setup
#### Environment requirement

##### VM server
- Linux
- kubernetes
- Rancher manager 2.9 ~ 2.12
##### Local computer
- node.js v20 and up
- npm 10 and up

#### Backend installation

##### Rancher manager
- [Installing/Upgrading Rancher](https://ranchermanager.docs.rancher.com/getting-started/installation-and-upgrade)

##### SBOMBastic
- [Quickstart](docs/installation/quickstart.md)
- [Uninstall](docs/installation/uninstall.md)

#### Frontend development environment setup

- Pull the code to your local computer
- Run `yarn` to install dependency packages
- Run `API=<Rancher UI's URL> yarn dev` to start the Rancher manager UI with security-ui-ext