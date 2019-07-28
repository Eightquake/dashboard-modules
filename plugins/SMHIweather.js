/**
  * A plugin to fetch a weather forecast from SMHI using the SMHI Open Data API, the license for using the API is CC-BY 4.0, so I can use it as long as I mention that the data is originally from SMHI.\n
  * To avoid spamming SMHI it only refreshes from the API file when the refresh-button is pressed, otherwise it just continues showing the forecast it has.
  * @author Victor Davidsson
  * @version 0.5.0
  */

const http = require("http");
/* INDEV, this won't be needed later */ const fs = require("fs");

let apiLink;
let griditem;

let data, dates;

/* RelativeTimeFormat to convert the dates from the API into a nice looking text, something like 2 hours ago */
const rtf = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});

function initWeather(detailArg, gridElementArg, detailName) {
  addCSS(detailName);

  let header = document.createElement("div");
  header.id = "smhi-weather-header";
  header.innerHTML = `<h3><i class="fas fa-map-marker-alt"></i>${detailArg.name}</h3>`;
  let updatedText = document.createElement("p");
  updatedText.id = "smhi-weather-updated";
  header.appendChild(updatedText);
  gridElementArg.appendChild(header);

  griditem = document.createElement("div");
  griditem.style = "width:100%;height:250px;"
  gridElementArg.appendChild(griditem);

  let reload = document.createElement("i");
  reload.classList.add("fas", "fa-redo", "weather-reload");
  reload.onclick = fetchData;
  gridElementArg.appendChild(reload);

  fetchData();
}

/**
  * A simple function that adds some new CSS rules for the grid-element.
  * @function
  * @private
  */
function addCSS(name) {
  let css = `
    div#${name} {
      width: 600px;
      height: 350px;
    }
    div#${name} i.fa-map-marker-alt {
      margin-top:-5px;
      padding:0 5px 0 5px;
      color:#f01c19;
    }
    div#${name} #smhi-weather-header {
      width:100%;
      height:100px;
      box-sizing: border-box;
      border-bottom:#CCC 1px solid;
      text-align:center;
    }
    div#${name} #smhi-weather-header #smhi-weather-updated {
      font-style:italic;
      color:#999;
    }
    div#${name} #smhi-weather-header h3 {
      font-weight:300;
      padding-top:30px;
      margin:0 0 5px 0;
    }
    div#${name} #smhi-weather-header p {
      margin-top:5px;
    }
    div#${name} .weather-reload {
      position: absolute;
      top: 1%;
      right: 1%;
      margin: 5px;
      cursor: pointer;
      padding:2px;
      color:#999;
    }
    div#${name} .smhi-weather-forecast {
      float:left;
      width:20%;
      height:100%;
      text-align:center;
      box-sizing: border-box;
      border:#EDEDED 1px solid;
    }
    div#${name} .smhi-weather-forecast h3 {
      font-weight:300;
      margin:10px 0 5px 0;
    }
    div#${name} .smhi-weather-forecast h4 {
      font-weight:300;
      margin:10px 0 5px 0;
    }
    div#${name} .smhi-weather-forecast p {
      margin:0;
      color:#666;
    }
    div#${name} .smhi-weather-forecast i.wsymb {
      font-size:48px;
      padding:15px 0 15px 0;
      color:#999;
    }
    div#${name} .smhi-weather-forecast i.fa-sun {
      color:#F2BB13;
    }
    div#${name} .smhi-weather-forecast i.fa-moon {
      color:#CCC;
    }
    div#${name} .smhi-weather-forecast i.fa-bolt {
      color:#FDD023;
    }
    div#${name} .smhi-weather-forecast i.fa-umbrella, div#${name} .smhi-weather-forecast i.fa-wind {
      padding-right:4px;
    }
  `;

  let link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('type', 'text/css');
  link.setAttribute('href', `data:text/css;charset=UTF-8, ${encodeURIComponent(css)}`);
  document.getElementsByTagName('head')[0].appendChild(link);
}

/**
  * Fetches the JSON-data from SMHI and calls the function to update the griditem when finished.
  * @function
  * @private
  */
function fetchData() {
  /* INDEV, let's not spam SMHI with requests
  apiLink = `http://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${detail.coordinates.lon}/lat/${detail.coordinates.lat}/data.json`;
  let apiData;
  http.get(apiLink, (response) => {
    let data = '';
    response.on('data', (chunk) => {
      data += chunk;
    })
    response.on('end', () => {
      apiData = JSON.parse(data);
      updateElement(apiData);
    })
  });
  */
  if(!data) {
    fs.readFile(__dirname + "/SMHIdata2019-07-28T100223Z.json", 'utf8', (err, readData) => {
      if(err) throw err;
      data = JSON.parse(readData);
      let date = new Date();
      dates = [];
      data.timeSeries.forEach((time) => {
        let dataTime = new Date(time.validTime);
        let offset = dataTime - date;
        /* If offset is more than -3600000, meaning if the forecasts is more than an hour old it will be included */
        if(offset >= -3600000) {
          dates.push(time);
        }
      });
      updateElement();
    });
  }
  else {
    updateElement();
  }
}

/**
  * Updates the griditem element with the latest data
  * @function
  * @private
  */
function updateElement() {
  /* Schedule to update this element every hour when the minute is 0 */
  global.schedule.scheduleJob("0 * * * *", updateElement);

  if(!data.approvedTime) {
    global.problem.emit("warn", "SMHI weather tried reading the data from SMHI but it wasn't found. Maybe the plugin is currently fetching the data, or the API has changed?");
    return;
  }

  /* Calculate how many hours it's been since the data was created/downloaded. */
  let apiObjectAge = Math.round((new Date(data.approvedTime) - new Date())/3600000);

  /* If it's been more than 7 days since it refreshed, it's time to update */
  if(apiObjectAge < -24*7) {
    global.problem.emit("info", "The data from SMHI hasn't been refreshed for a week! Forcing update now.");
    return fetchData();
  }

  /* Update the text to show when the JSON-file from SMHI was updated */
  document.querySelector("#smhi-weather-updated").innerHTML = rtf.format(apiObjectAge, "hours");

  /* Clear the div with all of the old forecasts before continuing */
  griditem.innerHTML = "";

  /* Let's make 5 forecasts with 3 hour jumps between them */
  for(let i=0; i<15; i+=3) {
    let forecastTime = new Date(dates[i].validTime);
    /* Calculate the difference in time from now to when the forecast is */
    let timediff = Math.round((forecastTime - new Date())/3600000);
    let timestring;
    /* If the timediff is quite close to now let's say now instead of in 1 hour */
    if(timediff <= 1) {
      timestring = "Now";
    }
    else {
      /* If the timediff is larger display the time using the RelativeTimeFormat, and capitalize the first letter */
      timestring = rtf.format(timediff, "hours").charAt(0).toUpperCase() + rtf.format(timediff, "hours").slice(1);
    }

    /* Find the parameter that is temperature, they seem to move around so I can't be sure where it is in the array */
    let temperatureIndex = dates[i].parameters.findIndex(function (element) {
      return element.name == "t";
    });
    let temperature = dates[i].parameters[temperatureIndex].values[0];

    let wsymbIndex = dates[i].parameters.findIndex(function (element) {
      return element.name == "Wsymb2";
    });
    let wsymb = translateWsymb2(dates[i].parameters[wsymbIndex].values[0], forecastTime);

    let precipitationIndex = dates[i].parameters.findIndex(function (element) {
      return element.name == "pmean";
    });
    let precipitation = dates[i].parameters[precipitationIndex].values[0];

    let windspeedIndex = dates[i].parameters.findIndex(function (element) {
      return element.name == "ws";
    });
    let windspeed = dates[i].parameters[windspeedIndex].values[0];


    /* Create a new temperature div that will contain this one forecast */
    let newTemp = document.createElement("div");
    newTemp.className = "smhi-weather-forecast";
    newTemp.innerHTML = `
      <h3>${timestring}</h3>
      <p>${forecastTime.getHours()}:00</p>
      <h4><i class="wsymb ${wsymb}"></i><br><br>${temperature} &deg;C</h4>
      <br>
      <p><i class="fas fa-umbrella"></i>${precipitation} mm</p>
      <p><i class="fas fa-wind"></i>${windspeed} m/s</p>`;
    griditem.appendChild(newTemp);
  }
}

/**
  * Translates the Wsymb2 value from the API to a font-awesome icon
  * @function
  * @private
  * @param {Integer} value - The Wsymb2 value
  * @param {Date} time - A date object from the validTime value that's used to determine if the icon should show day or night version
  * @returns {String} A string that can be used as the class to make the icon show correctly.
  */
function translateWsymb2(value, time) {
  let day = true;
  if(time && (time.getHours() < 6 || time.getHours() > 21)) {
    day = false;
  }
  /* SMHI uses a integer from 1 to 27 to tell the user what type of weather symbol should be used, table can be found at https://opendata.smhi.se/apidocs/metfcst/parameters.html#parameter-wsymb */
  let array = ["fas"];
  if(value < 1 || value > 27) {
    global.problem.emit("warn", "SMHI weather tried using a weather symbol that doesn't exist or isn't supported. It will be replaced with a question mark.");
    array.push("fa-question");
  }

  if(value <= 2) {
    array.push(day?"fa-sun":"fa-moon");
  }
  else if(value <= 5) {
    array.push(day?"fa-cloud-sun":"fa-cloud-moon");
  }
  else if(value <= 7) {
    array.push("fa-smog");
  }
  else if(value <= 8) {
    array.push("fa-cloud-rain");
  }
  else if(value <= 9) {
    array.push("fa-cloud-showers-heavy");
  }
  else if(value <= 10) {
    array.push("fa-cloud-showers-heavy");
  }
  else if(value <= 11) {
    array.push("fa-bolt");
  }
  else if(value <= 14) {
    array.push("fa-cloud-sleet");
  }
  else if(value <= 17) {
    array.push("fa-snowflake");
  }
  else if(value <= 18) {
    array.push("fa-cloud-rain");
  }
  else if(value <= 19) {
    array.push("fa-cloud-showers-heavy");
  }
  else if(value <= 20) {
    array.push("fa-cloud-showers-heavy");
  }
  else if(value <= 21) {
    array.push("fa-bolt");
  }
  else if(value <= 22) {
    array.push("fa-snowflake");
  }
  else if(value <= 24) {
    array.push("fa-snowflake");
  }
  else if(value <= 27) {
    array.push("fa-snowflake");
  }
  return array.join(" ");
}

module.exports = {
  type: "module",
  init: initWeather
};
