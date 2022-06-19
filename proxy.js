const origShell = require('./shell.js');
const common = require('./src/common.js');
const cmdArrayAttr = '__cmdStart__';

const promisifyExec = function(command, options) {
  options = { fatal: true, ...options, async: false };
  options.async = true;
  return new Promise((resolve, reject) => {
    origShell.exec(command, options, (code, stdout, stderr) => {
      const result = origShell.ShellString(stdout, stderr, code);
      if (code === 0) {
        resolve(result);
      } else {
        common.state.errorCode = code;
        common.state.error = 'exec: ' + stderr;
        const error = new common.CommandError(result);
        error.message = stderr;
        error.code = code;
        error.type = 'shell';
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });
  })
}

const proxyifyCmd = (t, ...cmdStart) => {
  // Create the target (or use the one passed in)
  t = t || function _t(...args) {
    // Wrap all the arguments in quotes
    const newArgs = cmdStart
      .concat(args)
      .map(x => JSON.stringify(x));
    // Run this command in the shell
    return promisifyExec(newArgs.join(' '));
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
      if (target[cmdArrayAttr].length === 0) {
        if (['__esModule', 'default'].includes(methodName)) {
          return proxyifyCmd(target);
        }

        if (methodName in target) {
          if (methodName === 'exec') {
            return promisifyExec;
          }

          const method = target[methodName];

          const ignoreOriginalList = [
            'error', 'errorCode', 'ShellString', 'env', 'config',
            'dirs', 'popd', 'pushd', 'clear', 'exit',
          ];
          if (ignoreOriginalList.includes(methodName)) {
            return method;
          }

          if (methodName === 'sleep') {
            return method.bind({ __async: true });
          }

          if (typeof method === 'function') {
            return function() {
              return new Promise((resolve, reject) => {
                const result = method.apply(target, arguments);
                if (result && typeof result.code !== 'undefined' && result.code !== 0) {
                  result.type = 'shell';
                  result.message = result.stderr;
                  reject(result);
                } else {
                  resolve(result);
                }
              });
            }
          }

          return method;
        }
      }

      // Don't Proxy-ify these attributes, no matter what
      const noProxyifyList = ['inspect', 'valueOf', 'stdout'];

      // Return the attribute, either if it exists or if it's in the
      // `noProxyifyList`, otherwise return a new Proxy
      if (methodName in target || noProxyifyList.includes(methodName)) {
        return target[methodName];
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
const shell = proxyifyCmd(origShell)
shell.sync = origShell;
module.exports = shell;
