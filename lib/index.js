"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dependency_mapper_1 = require("@webantic/dependency-mapper");
var path = require("path");
var debug = require("debug");
var log = debug('meteor-deps:log:' + module.id);
var error = debug('meteor-deps:error:' + module.id);
/* module variables */
var dependencyMap = {};
var callbackMap = {};
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
function wrapExports(parentModule, exports) {
    log('Wrapping exports');
    var initialExports = {
        inject: function (meteorDeps) {
            log('Injector called');
            inject(meteorDeps);
            parentModule.exports = Object.assign(parentModule.exports, exports);
        }
    };
    return initialExports;
}
exports.wrapExports = wrapExports;
/**
 * Store dependencies in this module, also initialise any submodules with the
 * same values. Finally notify anyone waiting on these values that they are
 * available
 *
 * @param {any} meteorDeps The dependencies to store
 */
function inject(meteorDeps) {
    log('Receiving dependencies');
    // Copy over the dependencies to our module's in-memory cache (called dependencyMap)
    for (var key in meteorDeps) {
        if (key !== 'default' && meteorDeps.hasOwnProperty(key)) {
            dependencyMap[key] = meteorDeps[key];
        }
    }
    initialiseSubmodules(meteorDeps);
    notifyWaiters();
}
exports.inject = inject;
/**
 * Work through this module's parent module's npm dependencies and inject any
 * Meteor dependencies to them
 *
 * @param {any} meteorDeps The dependencies to inject
 */
function initialiseSubmodules(meteorDeps) {
    log('Initialising submodules');
    // Get the module which includes this one's npm dependencies
    var parentModuleDir = path.resolve(__dirname, '../../../');
    var npmDependencies = dependency_mapper_1.default(parentModuleDir, true);
    var parentModuleName = Object.keys(npmDependencies)[0];
    npmDependencies = npmDependencies[parentModuleName];
    // the names of Meteor packages required by npm modules
    var meteorPackageNames = Object.keys(npmDependencies.allMeteorDependencies);
    // the names of npm dependencies which this module's parent module directly
    // depends on (basically this module's sibling modules)
    var npmModuleNames = Object.keys(npmDependencies.dependencies);
    // If this module's parent module depends on any npm modules which themselves
    // depend on Meteor packages...
    if (meteorPackageNames.length) {
        // ... iterate those npm modules and inject Meteor dependencies to them
        for (var _i = 0, npmModuleNames_1 = npmModuleNames; _i < npmModuleNames_1.length; _i++) {
            var moduleName = npmModuleNames_1[_i];
            var injectorSuffix = '/node_modules/@webantic/meteor-deps/index.js';
            var injectorPath = path.resolve(parentModuleDir, 'node_modules', moduleName, injectorSuffix);
            try {
                var injector = require(injectorPath).inject;
                if (injector && typeof injector === 'function') {
                    log('Injecting dependencies to ' + moduleName);
                    injector(meteorDeps);
                }
            }
            catch (ex) {
                error(ex.message);
            }
        }
    }
    else {
        log('No submodules with Meteor dependencies found');
    }
}
/**
 * Call any registered callbacks, providing the requested value
 *
 */
function notifyWaiters() {
    log('Notifying any watchers');
    for (var key in dependencyMap) {
        if (key in callbackMap) {
            while (callbackMap[key].length) {
                log('Invoking callback to provide value for ' + key);
                callbackMap[key].pop()(dependencyMap[key]);
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
function get(key, callback) {
    // If the dependency is available immediately, return it
    if (key in dependencyMap) {
        return dependencyMap[key];
    }
    // Ensure the requested key exists in the callback map
    callbackMap[key] = callbackMap[key] || [];
    if (typeof callback === 'function') {
        // If a callback was supplied, push it into the callback map
        callbackMap[key].push(callback);
    }
    else {
        // If no callback is provided, return a promise which resolves to the dependency
        return new Promise(function promiseResolver(resolve) {
            callbackMap.push(resolve);
        });
    }
}
//# sourceMappingURL=index.js.map