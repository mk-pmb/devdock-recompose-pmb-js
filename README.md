
<!--#echo json="package.json" key="name" underline="=" -->
devdock-recompose-pmb
=====================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Yet another docker-compose templating project
<!--/#echo -->


* related: [docker-devel-util-pmb][ddu-pmb]
* NOT related: [`npm:devdock`](https://github.com/mikesir87/devdock-node)

  [ddu-pmb]: (https://github.com/mk-pmb/docker-devel-util-pmb)



API
---

This module ESM-exports one function with one method:

### recompose(opt)

Where `opt` should be an object with (only) these keys:

* `proj`: Details about your docker-compose project
  * `name`: Project name.
  * `dir`: Path to project directory.

Returns a promise for the combined config.



Usage
-----

see [docs/examples/](docs/examples/)


<!--/include-->


<!--#toc stop="scan" -->



Known issues
------------

* Needs more/better tests and docs.




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
