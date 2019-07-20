[![npm version](https://badge.fury.io/js/install-lib.svg)](https://badge.fury.io/js/install-lib)

# install-lib
install-lib installs an npm package and all its dependencies as a single 
module.

### Why?
Have you ever opened your node_modules folder? It's crazy - why is there a 
package called _has_? Who made it? Who cares? If that's you, this package 
might help.

### Usage
It's easy, and works just like npm.

To add a package just use:
`npx install-lib [npm package]`

And to install all listed packages use:
`npx install-lib`

You can then use the package as a regular node module, install types, do
all the stuff that it makes sense to do.

There's no need to install it, just run it with npx.
Modules are exported to the node_modules directory, and appended to the 
package.json in the folder it's ran in.

### Underlying tech
This package makes heavy use of npx and the awesome @zeit/ncc.

### No Issues
This thing is new, and no issues have been discovered, which means it's
perfect. If you find something wrong, let me know or request a PR
yourself.