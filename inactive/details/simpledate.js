/* This could easily be just a JSON-file instead, and it would work without any problem. See simpledate.json */

module.exports = {
  style: "font-size: 32px; width: 300px; text-align: center;",
  string: "Today is:\n%DDDD, %MMMM %d\n%yyyy-%MM-%d\nAnd the time is:\n%hh:%mm",
  settings: {
    used_plugins: ["time.js"],
    update_interval: "0 0 0 * *"
  }
}
