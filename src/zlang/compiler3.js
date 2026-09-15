// Compatibility bridge for the evolved Z-native frontend.
// The generator historically imported ./compiler3; the native Luau compiler
// is now the canonical implementation.
module.exports = require('./nativeCompiler3.js');
