#libr
libr installs an npm package and all its dependencies as a single module.

### Why?
Have you ever opened your node_modules folder? It's crazy - why is there a 
package called _has_? Who made it? Who cares? If that's you, this package 
might help.

### Usage
It's easy, just use:
`npx install-lib [npm package]`

Don't install it, just run it with npx.

Modules are exported to a node_libs directory, in the folder it's ran in.
