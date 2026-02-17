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

##### SBOMScanner UI Extension
- In Tech preview phase, the UI extension is not registered into Rancher UI extension chart, thus the user needs to add the reposiory of SBOMScanner UI Extension manually.
  1. Open Apps > Repositories page, click the `Create` button
  ![](/pkg/sbomscanner-ui-ext/assets/img/doc/repositories.png)
  2. In the create repository page, enter a unique name. In the `Target` section, select `Git repository containing Helm chart or cluster template definitions`, and fill `https://github.com/neuvector/security-ui-exts.git` into the `Git Repo URL` field, fill `gh-pages` into the `Git Branch` field. Then click `Create` button and wait until the state of the new repository changes into `Active`.
  ![](/pkg/sbomscanner-ui-ext/assets/img/doc/create_reposiory.png)
  ![](/pkg/sbomscanner-ui-ext/assets/img/doc/repository_added.png)
  3. Open Extensions page, find SBOMScanner in `Available` tab, and install the latest version.
  ![](/pkg/sbomscanner-ui-ext/assets/img/doc/extensions.png)
  4. Open SBOMScanner page, install the backend service step by step. Until all the steps are completed, the Dashboard page is shown when opening SBOMScanner page.
  ![](/pkg/sbomscanner-ui-ext/assets/img/doc/install_1.png)
  ![](/pkg/sbomscanner-ui-ext/assets/img/doc/install_2.png)


##### SBOMScanner (In case of installing the backend service only)
- [Quickstart](docs/installation/quickstart.md)
- [Uninstall](docs/installation/uninstall.md)

#### Frontend development environment setup

- Pull the code to your local computer
- Run `yarn` to install dependency packages
- Run `API=<Rancher UI's URL> yarn dev` to start the Rancher manager UI with security-ui-ext

#### Open the UI on local computer
https://localhost:8005/