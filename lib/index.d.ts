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
declare function wrapExports(parentModule: any, exports: any): {
    inject(meteorDeps: any): void;
};
/**
 * Store dependencies in this module, also initialise any submodules with the
 * same values. Finally notify anyone waiting on these values that they are
 * available
 *
 * @param {any} meteorDeps The dependencies to store
 */
declare function inject(meteorDeps: any): void;
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
declare function get(key: string, callback?: Function): any;
export { inject, wrapExports, get };
