let FeedParser = require('feedparser');
let request = require('request');

let detail, gridelement;

/* RelativeTimeFormat to convert the dates from the API into a nice looking text, something like 2 hours ago */
const rtf = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});

function initReader(detailArg, gridElementArg, detailName) {
  detail = detailArg;
  gridelement = gridElementArg;

  addCSS(detailName);

  let rssRequest = request(detail.link);
  let feed = new FeedParser();

  rssRequest.on('error', function(error) {
    //global.problem.emit("error", "The request for the RSS feed encountered an error.<br>" + error);
    throw error;
  });
  rssRequest.on('response', function(resp) {
    let stream = this;

    if(resp.statusCode !== 200) {
      this.emit('error', new Error(`Bad status code from the request - expected 200 but got ${resp.statusCode}`));
    }
    else {
      stream.pipe(feed);
    }
  });
  feed.on('error', function (error) {
    global.problem.emit("error", "The parser for the RSS feed encountered an error.<br>" + error);
  });

  feed.on('readable', function () {
    let stream = this;
    let item;
    while (item = stream.read()) {
      let itemDate = new Date(item["pubDate"]);
      let itemAge = Math.round((itemDate - new Date())/3600000);
      let dateString;
      if(itemAge >= -1) {
        dateString = "Less than an hour ago";
      }
      else {
        dateString = rtf.format(itemAge, "hours");
      }

      let itemElement = document.createElement("div");
      itemElement.innerHTML = `
        <h4 class="RSS-desc">${item["description"]}</h4>
        <p class="RSS-footer">${item["title"]} | ${dateString}</p>
      `;
      gridelement.appendChild(itemElement);
    }
  });
}

function addCSS(name) {
  let css = `
    div#${name} {
      width: 600px;
    }
    div#${name} h3 {
      font-weight:300;
      margin:10px 0 5px 0;
    }
    div#${name} .RSS-desc {
      font-weight:300;
      margin:10px 0 5px 0;
    }
    div#${name} .RSS-footer {
      margin:0;
      color:#666;
      box-sizing: border-box;
      border-bottom:1px solid #CCC;
    }
  `;

  let link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('type', 'text/css');
  link.setAttribute('href', `data:text/css;charset=UTF-8, ${encodeURIComponent(css)}`);
  document.getElementsByTagName('head')[0].appendChild(link);
}

module.exports = {
  type: "module",
  init: initReader
}
