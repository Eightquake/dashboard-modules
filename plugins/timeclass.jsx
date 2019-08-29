import React from "react";

import "./timeclass.css";

/**
 * A React Component for a simple plugin that can be used for displaying time and date.
 * @see {@link https://github.com/Eightquake/dashboard-modules} for more information and the actual file as it isn't in this repo.
 * @category Plugins
 * @author Victor Davidsson
 * @version 1.0.0
 */

export default class TimeAndDate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: {
        time: this._update(this.props.detail.time || ""),
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
          time: this._update(this.props.detail.time || ""),
          body: this._update(this.props.detail.body || ""),
          footer: this._update(this.props.detail.footer || "")
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

    /* I dont quite like this solution of chaining a lot of replace-functions. Hopefully I will improve this sometime */
    let replacedText = text
      .replace(
        /(%hh)/g,
        date.getHours() < 10 ? "0" + date.getHours() : date.getHours()
      )
      .replace(
        /(%mm)/g,
        date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()
      )
      .replace(/(%ss)/g, date.getSeconds())
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
      ); /* I mean, this will work for a long time - but not forever. */

    return replacedText;
  }
  render() {
    return (
      <div className="timeclass" style={this.props.detail.style}>
        {this.state.text.time && (
          <div className="time">
            <h1>{this.state.text.time}</h1>
          </div>
        )}
        <div className="body">
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
