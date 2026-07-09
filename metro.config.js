const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep SVGs treated as source (transformed as components), not static assets
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts.push("svg");

// Make sure font files are explicitly recognized as assets
// (guards against them being stripped if assetExts is ever
// overridden elsewhere, e.g. by another package's config merge)
if (!config.resolver.assetExts.includes("ttf")) {
  config.resolver.assetExts.push("ttf");
}
if (!config.resolver.assetExts.includes("otf")) {
  config.resolver.assetExts.push("otf");
}

module.exports = config;