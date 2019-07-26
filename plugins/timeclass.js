/**
  * A class for a simple plugin that can be used for displaying time and date.
  * @category Plugins
  * @author Victor Davidsson
  * @version 1.5.0
  */


class TimeAndDate {
  /**
    * Creates a new time plugin, styles the grid-item and requests a animation frame for updating the text
    * @param {Object} detail - The detail object in it's entirety
    * @param {HTMLELement} gridelement - The gridelement created for the detail
    */
  constructor(detail, gridelement) {
    this.detail = detail;
    this.gridelement = gridelement;
    this.divelement = document.createElement("div");
    this.gridelement.style = this.detail.style;
    this.gridelement.appendChild(this.divelement);

    /* As this is a callback we need to bind the context (which is the object made from this class), otherwise it is lost */
    window.requestAnimationFrame(this._update.bind(this));
  }
  /**
    * Updates the text of the grid-item based on the details string. Not exactly private because, as far as I understood it, that is not implemented yet - but this is not supposed to be called by anything else than the requestAnimationFrame callback.
    * @private
    * @param {Double} timestamp - The DOMHighResTimeStamp of when the browser starts executing the callback functions. Currently unused.
    */
  _update() {
    /* Same here, it's important to bind the context */
    window.requestAnimationFrame(this._update.bind(this));
    let date = new Date();
    let fullDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    /* I dont quite like this solution of chaining a lot of replace-functions. Hopefully I will improve this sometime */
    this.divelement.innerText = this.detail.string
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
}

/* Exports the entire class. This way the code can create a new object from this class everytime it is needed */
module.exports = {
  type: "class",
  class: TimeAndDate,
}
