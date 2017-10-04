# Meteor Deps

A module to store all runtime Meteor dependencies for npm modules to consume

This module is part of a suite:
 - [Dependency Mapper](https://github.com/webantic/dependency-mapper)
 - [Meteor Loader](https://github.com/webantic/meteor-loader)
 - [Meteor Deps (this module)](https://github.com/webantic/meteor-deps)

## Setup

1. Add the injector to your module's `exports`:

  ```js
var wrapExports = require('@webantic/meteor-deps').wrapExports

var moduleExports = {
  thing1: require('./thing1.js'),
  thing2: require('./thing2.js')
}

module.exports = wrapExports(module, moduleExports)
  ```

    or

  ```js
import { inject } from '@webantic/meteor-deps'

import thing1 from './thing1.js'
import thing2 from './thing2.js'

export {
  thing1,
  thing2,
  inject
}
  ```

2. Declare your dependencies in your `package.json`:

  ```json
{
  "name": "my-cool-module",
  "version": "1.0.0",
  "dependencies": {},
  "meteorDependencies": {
    "meteor": ["client", "server"],
    "kadira:flow-router": "client"
  }
}
  ```

## Usage

All the exports of every Meteor dep in your project's npm modules will be available in the `meteor-deps` module. You can retrieve them with `.get()`:

```js
var getDep = require('@webantic/meteor-deps').get
var Meteor = getDep('Meteor')

// In some cases, you may need to access the value asynchronously, like this:
getDep('Meteor').then(function (Meteor) {
  // ...
})
```
