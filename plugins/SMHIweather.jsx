import React from "react";
import http from "http";

import "./SMHIweather.css";

let data;

/* RelativeTimeFormat to convert the dates from the API into a nice looking text, something like 2 hours ago */
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export default class SMHIWeather extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.detail.name || "Unknown",
      apiLink: `http://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${props.detail.coordinates.lon}/lat/${props.detail.coordinates.lat}/data.json`,
      apiObjectAge: 0,
      cardList: []
    };
  }
  componentDidMount() {
    this._fetchData();
    /* <TODO>Fix the scheduling to be something better</TODO> */
    this.timerID = setInterval(() => {
      this._updateCards();
    }, 1000);
  }
  componentWillUnmount() {
    clearInterval(this.timerID);
  }
  _fetchData = () => {
    http.get(this.state.apiLink, response => {
      let readData = "";
      response.on("data", chunk => {
        readData += chunk;
      });
      response.on("end", () => {
        data = JSON.parse(readData);
        let date = new Date();
        let newDates = [];
        data.timeSeries.forEach(time => {
          let dataTime = new Date(time.validTime);
          let offset = dataTime - date;
          /* If offset is more than -3600000, meaning if the forecasts is less than an hour old or is in the future it will be included */
          if (offset >= -3600000) {
            newDates.push(time);
          }
        });
        this.setState({ approvedTime: data.approvedTime, dates: newDates });
      });
    });
  };
  _translateWsymb2ToFa = (value, time) => {
    let day = true;
    if (time && (time.getHours() < 6 || time.getHours() > 21)) {
      day = false;
    }
    /* SMHI uses a integer from 1 to 27 to tell the user what type of weather symbol should be used, table can be found at https://opendata.smhi.se/apidocs/metfcst/parameters.html#parameter-wsymb */
    let array = ["fas"];
    if (value < 1 || value > 27) {
      global.problem.emit(
        "warn",
        "SMHI weather tried using a weather symbol that doesn't exist or isn't supported. It will be replaced with a question mark."
      );
      array.push("fa-question");
    }

    if (value <= 2) {
      array.push(day ? "fa-sun" : "fa-moon");
    } else if (value <= 5) {
      array.push(day ? "fa-cloud-sun" : "fa-cloud-moon");
    } else if (value <= 7) {
      array.push("fa-smog");
    } else if (value <= 8) {
      array.push("fa-cloud-rain");
    } else if (value <= 9) {
      array.push("fa-cloud-showers-heavy");
    } else if (value <= 10) {
      array.push("fa-cloud-showers-heavy");
    } else if (value <= 11) {
      array.push("fa-bolt");
    } else if (value <= 14) {
      array.push("fa-cloud-sleet");
    } else if (value <= 17) {
      array.push("fa-snowflake");
    } else if (value <= 18) {
      array.push("fa-cloud-rain");
    } else if (value <= 19) {
      array.push("fa-cloud-showers-heavy");
    } else if (value <= 20) {
      array.push("fa-cloud-showers-heavy");
    } else if (value <= 21) {
      array.push("fa-bolt");
    } else if (value <= 22) {
      array.push("fa-snowflake");
    } else if (value <= 24) {
      array.push("fa-snowflake");
    } else if (value <= 27) {
      array.push("fa-snowflake");
    }
    return array.join(" ");
  };
  _updateCards = () => {
    /* Calculate how many hours it's been since the data was created/downloaded. */
    let apiObjectAge = Math.round(
      (new Date(this.state.approvedTime) - new Date()) / 3600000
    );

    let cards = { apiObjectAge, list: [] };
    /* Let's make 5 forecasts with 3 hour jumps between them */
    for (let i = 0; i < 15; i += 3) {
      let forecastTime = new Date(this.state.dates[i].validTime);
      /* Calculate the difference in time from now to when the forecast is */
      let timediff = Math.round((forecastTime - new Date()) / 3600000);
      let timestring;
      /* If the timediff is quite close to now let's say now instead of in 1 hour */
      if (timediff <= 1) {
        timestring = "Now";
      } else {
        /* If the timediff is larger display the time using the RelativeTimeFormat, and capitalize the first letter */
        timestring =
          rtf
            .format(timediff, "hours")
            .charAt(0)
            .toUpperCase() + rtf.format(timediff, "hours").slice(1);
      }

      /* Find the parameter that is temperature, they seem to move around so I can't be sure where it is in the array */
      let temperatureIndex = this.state.dates[i].parameters.findIndex(function(
        element
      ) {
        return element.name === "t";
      });
      let temperature = this.state.dates[i].parameters[temperatureIndex]
        .values[0];

      let wsymbIndex = this.state.dates[i].parameters.findIndex(function(
        element
      ) {
        return element.name === "Wsymb2";
      });
      let wsymb = this._translateWsymb2ToFa(
        this.state.dates[i].parameters[wsymbIndex].values[0],
        forecastTime
      );

      let precipitationIndex = this.state.dates[i].parameters.findIndex(
        function(element) {
          return element.name === "pmean";
        }
      );
      let precipitation = this.state.dates[i].parameters[precipitationIndex]
        .values[0];

      let windspeedIndex = this.state.dates[i].parameters.findIndex(function(
        element
      ) {
        return element.name === "ws";
      });
      let windspeed = this.state.dates[i].parameters[windspeedIndex].values[0];

      cards.list.push({
        forecastTime,
        timestring,
        temperature,
        wsymb,
        precipitation,
        windspeed
      });
    }
    this.setState({ apiObjectAge, cardList: cards.list });
  };
  render() {
    return (
      <div className="SMHIweathercard">
        <div id="smhi-weather-header">
          <i className="fas fa-redo weather-reload" onClick={this._fetchData} />
          <h3>
            <i className="fas fa-map-marker-alt"></i>
            {this.state.name}
          </h3>
          <p id="smhi-weather-updated">
            Last updated {rtf.format(this.state.apiObjectAge, "minutes")}
          </p>
        </div>
        {this.state.cardList.map((element, index) => (
          <div className="smhi-weather-forecast" key={index}>
            <h3>{element.timestring}</h3>
            <p>{element.forecastTime.getHours()}:00</p>
            <h4>
              <i className={"wsymb " + element.wsymb} />
              <br />
              <br />
              {element.temperature} &deg;C
            </h4>
            <br />
            <p>
              <i className="fas fa-umbrella" />
              {element.precipitation} mm
            </p>
            <p>
              <i className="fas fa-wind" />
              {element.windspeed} m/s
            </p>
          </div>
        ))}
      </div>
    );
  }
}
