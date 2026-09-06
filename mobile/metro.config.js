const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const parentRoot = path.resolve(projectRoot, "..");
const config = getDefaultConfig(projectRoot);

// Stay inside this app. The parent Vite repo has a different React.
config.watchFolders = [projectRoot];
const parentModules = path
  .resolve(parentRoot, "node_modules")
  .replace(/[/\\]/g, "[/\\\\]");
config.resolver.blockList = [new RegExp(`${parentModules}[/\\\\].*`)];
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, "node_modules/react"),
  "react-native": path.resolve(projectRoot, "node_modules/react-native"),
};

module.exports = config;
