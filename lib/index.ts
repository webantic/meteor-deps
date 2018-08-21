import mapper from '@webantic/dependency-mapper'
import * as debug from 'debug'
import * as path from 'path'

const log = debug('meteor-deps:log:' + module.id)
const error = debug('meteor-deps:error:' + module.id)

/* module variables */
const dependencyMap: any = {}
const callbackMap: any = {}

/**
 * Take a module object and an exports map and return an object with an inject
 * method which adds the supplied exports to the module exports after the
 * injector has been called once
 *
 * @param {*} parentModule A reference to the module object in the importing
 * module
 * @param {*} exports An export map
 * @returns {*} An object with an `inject` method
 */
function wrapExports (parentModule: any, exports: any) {
  log('Wrapping exports')

  const initialExports = {
    inject (meteorDeps: any) {
      log('Injector called')

      inject(meteorDeps)
      parentModule.exports = Object.assign(parentModule.exports, exports)
    }
  }

  return initialExports
}

/**
 * Store dependencies in this module, also initialise any submodules with the
 * same values. Finally notify anyone waiting on these values that they are
 * available
 *
 * @param {any} meteorDeps The dependencies to store
 */
function inject (meteorDeps: any) {
  log('Receiving dependencies')

  // Copy over the dependencies to our module's in-memory cache (called dependencyMap)
  for (const key in meteorDeps) {
    if (key !== 'default' && meteorDeps.hasOwnProperty(key)) {
      dependencyMap[key] = meteorDeps[key]
    }
  }

  initialiseSubmodules(meteorDeps)
  notifyWaiters()
}

/**
 * Work through this module's parent module's npm dependencies and inject any
 * Meteor dependencies to them
 *
 * @param {any} meteorDeps The dependencies to inject
 */
function initialiseSubmodules (meteorDeps: any) {
  log('Initialising submodules')

  // Get the module which includes this one's npm dependencies
  const parentModuleDir = path.resolve(__dirname, '../../../')
  let npmDependencies: any = mapper(parentModuleDir, true)
  const parentModuleName = Object.keys(npmDependencies)[0]
  npmDependencies = npmDependencies[parentModuleName]

  // the names of Meteor packages required by npm modules
  const meteorPackageNames = Object.keys(npmDependencies.allMeteorDependencies)

  // the names of npm dependencies which this module's parent module directly
  // depends on (basically this module's sibling modules)
  const npmModuleNames = Object.keys(npmDependencies.dependencies)

  // If this module's parent module depends on any npm modules which themselves
  // depend on Meteor packages...
  if (meteorPackageNames.length) {
    // ... iterate those npm modules and inject Meteor dependencies to them
    for (const moduleName of npmModuleNames) {
      const injectorSuffix = '/node_modules/@webantic/meteor-deps/index.js'
      const injectorPath = path.resolve(parentModuleDir, 'node_modules', moduleName, injectorSuffix)

      try {
        const { inject: injector } = require(injectorPath)

        if (injector && typeof injector === 'function') {
          log('Injecting dependencies to ' + moduleName)
          injector(meteorDeps)
        }
      } catch (ex) {
        error(ex.message)
      }
    }
  } else {
    log('No submodules with Meteor dependencies found')
  }
}

/**
 * Call any registered callbacks, providing the requested value
 *
 */
function notifyWaiters () {
  log('Notifying any watchers')
  for (const key in dependencyMap) {
    if (key in callbackMap) {
      while (callbackMap[key].length) {
        log('Invoking callback to provide value for ' + key)
        callbackMap[key].pop()(dependencyMap[key])
      }
    }
  }
}

/**
 * Get a Meteor dependency. Returns immediately if the dependency is available
 * when this function is invoked. Otherwise calls a supplied callback, unless
 * one is not supplied - in which case a promise is returned that resolves to
 * the requested dependency
 *
 * @param {string} key The name of the dependency to get. e.g. "Meteor" or "Mongo"
 * @param {Function} [callback] An optional callback function which receives
 * the requested dependency as soon as it becomes available
 * @returns {any|void|Promise}
 */
function get (key: string, callback?: any) {
  // If the dependency is available immediately, return it
  if (key in dependencyMap) {
    return dependencyMap[key]
  }

  // Ensure the requested key exists in the callback map
  callbackMap[key] = callbackMap[key] || []

  if (typeof callback === 'function') {
    // If a callback was supplied, push it into the callback map
    callbackMap[key].push(callback)
  } else {
    // If no callback is provided, return a promise which resolves to the dependency
    return new Promise((resolve) => {
      callbackMap[key].push(resolve)
    })
  }
}

export {
  inject,
  wrapExports,
  get
}
