let crypto;
try {
  crypto = require("node:crypto");
  console.log("crypto support is enabled!");
} catch (err) {
  console.error("crypto support is disabled!");
}
