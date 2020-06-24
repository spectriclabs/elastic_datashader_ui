var _ = require('lodash');

const numericFieldTypes = [
  'long',
  'integer',
  'short',
  'byte',
  'double',
  'float',
  'half_float',
  'scaled_float',
];

export const isNumeric = (field) => {
  // Each field might have different types in different indices; as long as
  // one of them is numeric we return true
  let result = false;

  _.forOwn(field, (value, key) => {
    if (numericFieldTypes.includes(value.type) === true) {
      result = true;
      return false; // break out of loop
    }
  });

  return result;
};

export const isAggregatable = (field) => {
  // Each field might have different types in different indices; as long as
  // one of them is aggregatable we return true
  let result = false;

  _.forOwn(field, (value, key) => {
    if (value.aggregatable === true) {
      result = true;
      return false; // break out of loop
    }
  });

  return result;
};
