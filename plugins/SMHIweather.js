/**
  * A plugin to fetch a weather forecast from SMHI using the SMHI Open Data API, the license for using the API is CC-BY 4.0, so I can use it as long as I mention that the data is originally from SMHI.
  * @author Victor Davidsson
  * @version 0.5.0
  */

const http = require("http");

let apiLink;
let detail, griditem;

let style = "";
function initWeather(detailArg, gridElementArg, detailName) {
  addCSS(detailName);
  detail = detailArg;
  griditem = document.createElement("div");

  let reload = document.createElement("i");
  reload.classList.add("fas", "fa-redo", "weather-reload");
  reload.onclick = fetchData;
  gridElementArg.appendChild(reload);
  gridElementArg.appendChild(griditem);

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
      padding:10px;
      width: 500px;
      height:200px;
    }
    div#${name} h3 {
      margin-top: 0;
      text-align:center;
      font-weight:300;
    }
    div#${name} i {
      padding:0 5px 0 5px;
    }
    .weather-reload {
      position: absolute;
      top: 1%;
      right: 1%;
      margin: 5px;
      cursor: pointer;
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
  updateElement();
}

/**
  * Updates the griditem element with the latest data
  * @function
  * @private
  */
function updateElement(data) {
  /* INDEV, let's not do this now
  let currentTemp = data.timeSeries[0].parameters[11].values[0] + " " + data.timeSeries[0].parameters[11].unit;
  */
  let currentTemp = "32 Cel";
  griditem.innerHTML = `<h3><i class="fas fa-map-marker-alt"></i>${detail.name}</h3><p>Right now it's ${currentTemp}`;
}


module.exports = {
  type: "module",
  init: initWeather
};
