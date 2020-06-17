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

export const isNumeric = (field) => numericFieldTypes.includes(field.type);
