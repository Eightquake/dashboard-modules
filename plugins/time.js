/**
  * A simple module that displays the time.
  * Can only handle one detail at a time - I think this is a limitation to node-schedule
  * @category Plugins
  * @module TimeAndDate
  * @author Victor Davidsson
  * @version 0.5.0
  */

let detail, divelement;

let fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


/**
  * The init function of this module. It saves the detail from the arguments, creates a new div in the grid-item and requests a animation frame to update the text.
  * @function
  * @public
  * @param {Object} detailArg - The detail object in it's entirety
  * @param {HTMLElement} gridelementArg - The grid-item created for the detail
  */
function handler(detailArg, gridelementArg) {
  detail = detailArg;
  divelement = document.createElement("div");

  gridelementArg.style = detail.style;
  gridelementArg.appendChild(divelement);

  window.requestAnimationFrame(update);
}

/**
  * Updates the text of the div in the grid-item and requests a animation frame to update it next time.
  * @function
  * @private
  * @param {Double} timestamp - The DOMHighResTimeStamp of when the browser starts executing the callback functions. Currently unused.
  */
function update() {
  window.requestAnimationFrame(update);
  let date = new Date();
  /* I dont quite like this solution of chaining a lot of replace-functions. Hopefully I will improve this sometime */
  divelement.innerText = detail.string
    .replace(/(%hh)/g, date.getHours())
    .replace(/(%mm)/g, (date.getMinutes()<10)?"0" + date.getMinutes():date.getMinutes())
    .replace(/(%ss)/g, date.getSeconds())
    .replace(/(%DDDD)/g, fullDays[date.getDay()])
    .replace(/(%DD)/g, fullDays[date.getDay()].substring(0, 3))
    .replace(/(%d)/g, (date.getDate()<10)?"0" + date.getDate():date.getDate())
    .replace(/(%MMMM)/g, fullMonths[date.getMonth()])
    .replace(/(%MMMM)/g, fullMonths[date.getMonth()])
    .replace(/(%MMM)/g, fullMonths[date.getMonth()].substring(0, 3))
    .replace(/(%MM)/g, ((date.getMonth() < 9) ? "0" + (date.getMonth() + 1) : date.getMonth() + 1))
    .replace(/(%m)/g, date.getMonth()+1)
    .replace(/(%yyyy)/g, date.getFullYear())
    .replace(/(%y)/g, date.getFullYear() - 2000); /* I mean, this will work for a long time - but not forever. */
}

/* Exports an object with everything needed for the plugin to function. */
module.exports = {
  type: "module",
  init: handler,
}
