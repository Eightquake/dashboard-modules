/**
  * A plugin to fetch a weather forecast from SMHI using the SMHI Open Data API, the license for using the API is CC-BY 4.0, so I can use it as long as I mention that the data is originally from SMHI.
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
  griditem.style = "width:100%;height:150px;"
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
      width: 500px;
      height:250px;
    }
    div#${name} i.fa-redo {
      padding:0 5px 0 5px;
      color:rgb(71, 168, 242);
    }
    div#${name} i.fa-map-marker-alt {
      margin-top:-5px;
      padding:0 5px 0 5px;
      color:#666;
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
    }
    div#${name} .smhi-weather-forecast {
      float:left;
      width:20%;
      height:100%;
      text-align:center;
      box-sizing: border-box;
      border:#EDEDED 1px solid;
    }
    div#${name} .smhi-weather-forecast i {
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
    fs.readFile(__dirname + "/SMHIdata.json", 'utf8', (err, readData) => {
      if(err) throw err;
      data = JSON.parse(readData);
      let date = new Date();
      dates = [];
      data.timeSeries.forEach((time) => {
        let dataTime = new Date(time.validTime);
        let offset = dataTime - date;
        if(dates.length > 0 && Math.abs(offset) < Math.abs(dates[0].offset) && offset >= 0) {
          dates.unshift({
            date: dataTime,
            offset: dataTime - date,
            data: time
          });
        }
        else if(offset >= 0) {
          dates.push({
            date: dataTime,
            offset: dataTime - date,
            data: time
          });
        }
      });
      updateElement(dates);
    });
  }
  else {
    updateElement(dates);
  }
}

/**
  * Updates the griditem element with the latest data
  * @function
  * @private
  */
function updateElement(datesArg) {
  /* Update the text to show when the JSON-file from SMHI was updated */
  document.querySelector("#smhi-weather-updated").innerHTML = rtf.format(Math.round((new Date(data.approvedTime) - new Date())/3600000), "hours");

  /* Clear the div with all of the old forecasts before continuing */
  griditem.innerHTML = "";

  /* Let's make 5 forecasts with 3 hour jumps between them */
  for(let i=0; i<15; i+=3) {
    /* Calculate the difference in time from now to when the forecast is */
    let timediff = Math.round((new Date(datesArg[i].data.validTime) - new Date())/3600000);
    let timestring;
    /* If the timediff is quite close to now let's say now instead of in 1 hour */
    if(timediff <= 1) {
      timestring = "Now";
    }
    else {
      timestring = rtf.format(timediff, "hours").charAt(0).toUpperCase() + rtf.format(timediff, "hours").slice(1);
    }

    /* Find the parameter that is temperature, they seem to move around so I can't be sure where it is in the array */
    let temperatureIndex = datesArg[i].data.parameters.findIndex(function (element) {
      return element.name == "t";
    });
    let temperature = datesArg[i].data.parameters[temperatureIndex].values[0];

    let wsymbIndex = datesArg[i].data.parameters.findIndex(function (element) {
      return element.name == "Wsymb2";
    });
    let wsymb = translateWsymb2(datesArg[i].data.parameters[wsymbIndex].values[0], new Date(datesArg[i].data.validTime));
    console.log(datesArg[i].data.validTime, wsymb);
    /* Create a new temperature div that will contain this one forecast */
    let newTemp = document.createElement("div");
    newTemp.className = "smhi-weather-forecast";
    newTemp.innerHTML = `<p>${timestring}<br><i class="${wsymb}"></i><br>${temperature}&deg;</p>`;
    griditem.appendChild(newTemp);
  }
}

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
