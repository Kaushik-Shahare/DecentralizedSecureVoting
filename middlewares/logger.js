// Writing logging using winston
// winston is a popular node.js logging library. It provides a lot of flexibility
// and customization options.

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf, colorize, json } = format;

// A custom format for logging to the console with colors
// The colorize() format enables colored logging to the console
// The printf() format enables a custom log message format
const consoleLogFormate = format.combine(
  // Enable colored logging to the console
  colorize(),
  // Custom log message format
  printf(({ level, message, timestamp }) => {
    // This will print the timestamp, level and message to the console
    // with colors
    return `${timestamp} : ${level} : ${message}`;
  }),
);

// Create a winston logger
// The logger will log messages to the console and a file
const logger = createLogger({
  // The logging level. In this case, it is set to 'info'
  level: "info",
  // The format for logging. In this case, it is a combination of
  // the timestamp, colorize and json formats
  format: combine(
    // The timestamp format will add a timestamp to each log message
    timestamp(),
    // The colorize format will enable colored logging to the console
    colorize(),
    // The json format will log messages as JSON
    json(),
  ),
  // The transports for the logger. In this case, it is the console
  // and a file
  transports: [
    // The console transport will log messages to the console
    new transports.Console({
      // The level for the console transport. In this case, it is
      // set to 'info'
      level: "info",
      // The format for the console transport. In this case, it is
      // the custom format defined above
      format: consoleLogFormate,
    }),
    // The file transport will log messages to a file
    new transports.File({ filename: "./logs/app.log" }),
  ],
});

// Export the logger
module.exports = logger;
