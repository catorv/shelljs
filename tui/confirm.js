const chooser = require('./chooser.js');

module.exports = async function(options, defaultValue = true) {
  if (typeof options === 'string') {
    options = { title: options };
  }

  const items = options.items;
  if (typeof items !== 'undefined') {
    if (!Array.isArray(items) || items.length !== 2) {
      throw new Error('options.items must be a array with two items');
    }
  }

  const value = await chooser({
    items: ['Yes', 'No'],
    value: defaultValue ? 0 : 1,
    inline: true,
    onKeyPress: function(event) {
      if (event.name === 'y') {
        return { value: 0, select: true };
      } else if (event.name === 'n') {
        return { value: 1, select: true };
      }
    },
    ...options,
  });

  return value === 0;
}
