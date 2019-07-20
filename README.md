# install-lib
install-lib installs an npm package and all its dependencies as a single 
module.

### Why?
Have you ever opened your node_modules folder? It's crazy - why is there a 
package called _has_? Who made it? Who cares? If that's you, this package 
might help.

### Usage
It's easy, tp add a package just use:
`npx install-lib [npm package]`

And to install all listed packages use:
`npm install-lib`

There's no need to install it, just run it with npx.
Modules are exported to the node_modules directory, and appended to the 
package.json in the folder it's ran in.
