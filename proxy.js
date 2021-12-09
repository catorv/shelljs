const { ChildProcess } = require('child_process');
const origShell = require('./shell.js');
const cmdArrayAttr = '__cmdStart__';

const proxyifyCmd = (t, ...cmdStart) => {
  // Create the target (or use the one passed in)
  t = t || function _t(...args) {
    // Wrap all the arguments in quotes
    const newArgs = cmdStart
      .concat(args)
      .map(x => JSON.stringify(x));
    // Run this command in the shell
    return new Promise((resolve, reject) => {
      const context = {
        __async: true,
        __resolve: resolve,
        __reject: reject
      };
      origShell.exec.call(context, newArgs.join(' '));
    });
  };
  // Store the list of commands, in case we have a subcommand chain
  t[cmdArrayAttr] = cmdStart;

  // Create the handler
  const handler = {
    // Don't delete reserved attributes
    deleteProperty: (target, methodName) => {
      if (methodName === cmdArrayAttr) {
        throw new Error(`Cannot delete reserved attribute '${methodName}'`);
      }
      delete target[methodName];
    },

    // Don't override reserved attributes
    set: (target, methodName, value) => {
      if (methodName === cmdArrayAttr) {
        throw new Error(`Cannot modify reserved attribute '${methodName}'`);
      }
      target[methodName] = value;
      return target[methodName];
    },

    // Always defer to `target`
    has: (target, methodName) => (methodName in target),
    ownKeys: target => Object.keys(target),

    // Prefer the existing attribute, otherwise return another Proxy
    get: (target, methodName) => {
      // Don't Proxy-ify these attributes, no matter what
      const noProxyifyList = ['inspect', 'valueOf'];

      // Return the attribute, either if it exists or if it's in the
      // `noProxyifyList`, otherwise return a new Proxy
      if (noProxyifyList.includes(methodName)) {
        return target[methodName];
      } else if (methodName in target) {
        const method = target[methodName];
        if (typeof method === 'function') {
          return function() {
            return new Promise((resolve, reject) => {
              const context = {
                __async: true,
                __resolve: resolve,
                __reject: reject
              };
              const result = method.apply(context, arguments);
              if (result instanceof ChildProcess) return;
              if (result && typeof result.then === 'function') {
                result.then(resolve).catch(reject);
              } else if (result.code === 0) {
                resolve(result);
              } else {
                reject({
                  code: result.code,
                  type: 'shell',
                  message: result.stderr,
                  stdout: result.stdout,
                });
              }
            });
          }
        }
        return method;
      }
      return proxyifyCmd(null, ...target[cmdArrayAttr], methodName);
    },
  };

  // Each command and subcommand is a Proxy
  return new Proxy(t, handler);
};

// TODO(nate): put hooks in ShellString so that I can Proxy-ify it to allow new
// commands on the right hand side of pipes

// const OrigShellString = origShell.ShellString;
// // modify prototypes
// function ShellStringProxy(...args) {
//   return proxyifyCmd(new OrigShellString(...args));
// }
// origShell.ShellString = ShellStringProxy;

// export the modified shell
module.exports = proxyifyCmd(origShell);
