const { parse } = require("dotenv");
const { readFileSync } = require("fs");
const { join } = require("path");

const dotenv = parse(readFileSync(join(__dirname, ".env")));

module.exports = {
  apps: [
    {
      name: "voicenote",
      cwd: "/var/www/voicenote",
      script: "node_modules/.bin/next",
      args: "start -p 3016",
      env: { NODE_ENV: "production", ...dotenv },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
    },
  ],
};
