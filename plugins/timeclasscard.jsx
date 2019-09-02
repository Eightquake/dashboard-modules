import React from "react";

import "./timeclass.css";

/**
 * A React Component for a simple plugin that can be used for displaying time and date in the style of a card from Bootstrap.
 * @see {@link https://github.com/Eightquake/dashboard-modules} for more information and the actual file as it isn't in this repo.
 * @category Plugins
 * @author Victor Davidsson
 * @version 1.0.0
 */

export default class TimeAndDateCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: {
        header: this._update(this.props.detail.header || ""),
        body: this._update(this.props.detail.body || ""),
        footer: this._update(this.props.detail.footer || "")
      }
    };
  }
  componentDidMount() {
    /* <TODO>Fix the scheduling to be something better</TODO> */
    this.timerID = setInterval(() => {
      this.setState({
        text: {
          header: this._update(this.props.detail.header || ""),
          body: this._update(this.props.detail.body || "")
        }
      });
    }, 1000);
  }
  componentWillUnmount() {
    clearInterval(this.timerID);
  }
  addNth() {
    let date = new Date().getDate();
    if (date > 3 && date < 21) return "th";
    switch (date % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }
  /**
   * Updates the text of the grid-item based on the details string. Not exactly private because, as far as I understood it, that is not implemented yet - but this is not supposed to be called by anything else than the component itself
   * @private
   */
  _update(text) {
    if (!text) return "";
    let date = new Date();
    let fullDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];
    let fullMonths = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    /* I dont quite like this solution of chaining a lot of replace-functions. Hopefully I will improve this sometime. Actually after using console.time, this method only takes 0.05ms on average so it's not bad performance-wise, but it doesn't look pretty */
    let replacedText = text
      .replace(/(%hh)/g, date.getHours())
      .replace(
        /(%mm)/g,
        date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
      )
      .replace(
        /(%ss)/g,
        date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()
      )
      .replace(/(%DDDD)/g, fullDays[date.getDay()])
      .replace(/(%DD)/g, fullDays[date.getDay()].substring(0, 3))
      .replace(/(%dth)/g, this.addNth)
      .replace(
        /(%dd)/g,
        date.getDate() < 10 ? "0" + date.getDate() : date.getDate()
      )
      .replace(/(%d)/g, date.getDate())
      .replace(/(%MMMM)/g, fullMonths[date.getMonth()])
      .replace(/(%MMMM)/g, fullMonths[date.getMonth()])
      .replace(/(%MMM)/g, fullMonths[date.getMonth()].substring(0, 3))
      .replace(
        /(%MM)/g,
        date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1
      )
      .replace(/(%m)/g, date.getMonth() + 1)
      .replace(/(%yyyy)/g, date.getFullYear())
      .replace(
        /(%y)/g,
        date.getFullYear() - 2000
      ); /* I mean, getFullYear will work for a long time - but not forever. */
    return replacedText;
  }
  render() {
    return (
      <div className="card timeclasscard" style={this.props.detail.style}>
        {this.state.text.header && (
          <div className="card-header drag-handle">
            <h1>{this.state.text.header}</h1>
          </div>
        )}
        <div className="card-body">
          <h3>{this.state.text.body}</h3>
        </div>
        {this.state.text.footer && (
          <div className="card-footer">
            <h1>{this.state.text.footer}</h1>
          </div>
        )}
      </div>
    );
  }
}
