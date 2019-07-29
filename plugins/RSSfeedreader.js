let FeedParser = require('feedparser');
let request = require('request');

let detail, gridelement, griditem;

/* RelativeTimeFormat to convert the dates from the API into a nice looking text, something like 2 hours ago */
const rtf = new Intl.RelativeTimeFormat('en', {numeric: 'auto'});

function initReader(detailArg, gridElementArg, detailName) {
  detail = detailArg;
  gridelement = gridElementArg;

  let topBar = document.createElement("div");
  topBar.className = "RSS-top-bar";
  /* If possible, link to the forumLink instead of the actual RSS feed */
  let topBarLink = detail.forumLink?detail.forumLink:detail.link;
  topBar.innerHTML = `
    <a title="${topBarLink}" href="${topBarLink}"><i class="fas fa-external-link-alt"></i></a>
  `;
  let refresh = document.createElement("a");
  refresh.innerHTML = '<i class="fas fa-redo"></i>';
  refresh.onclick = fetchRSSFeed;
  topBar.appendChild(refresh);

  griditem = document.createElement("div");
  griditem.className = "RSS-card-list";

  gridelement.appendChild(topBar);
  gridelement.appendChild(griditem);

  addCSS(detailName);
  fetchRSSFeed();
}

function addCSS(name) {
  let css = `
    div#${name} {
      width: 600px;
      height:600px;
    }
    div#${name} h3 {
      font-weight:300;
      margin:10px 0 5px 0;
    }
    div#${name} .RSS-top-bar {
      width:100%;
      height:2em;
      line-height:1.5em;
      text-align:right;
    }
    div#${name} .RSS-top-bar i {
      color:#999;
      margin: 4px 0 4px 0;
      padding:0 5px 0 5px;
      cursor:pointer;
      display:inline-block;
    }
    div#${name} .RSS-card-list {
      height:calc(100% - 2em);
      overflow-y:scroll;
    }
    div#${name} .RSS-card {
      font-weight:300;
      margin:0.5em;
      box-sizing: border-box;
      border-bottom:1px solid #CCC;
    }
    div#${name} .RSS-desc {
      font-weight:300;
      margin:10px 5px 5px 5px;
    }
    div#${name} .RSS-desc a {
      color:#666;
    }
    div#${name} .RSS-footer {
      margin:-0.5em 0 0 0;
      float:right;
      color:#666;
    }
    div#${name} .RSS-footer a {
      color:#999;
    }
    div#${name} .RSS-footer p {
      margin:0 0.5em 0 0.5em;
      padding:0 0 0 0.5em;
      float:right;
      box-sizing: border-box;
      border-left:1px solid #999;
    }
  `;

  let link = document.createElement('link');
  link.setAttribute('rel', 'stylesheet');
  link.setAttribute('type', 'text/css');
  link.setAttribute('href', `data:text/css;charset=UTF-8, ${encodeURIComponent(css)}`);
  document.getElementsByTagName('head')[0].appendChild(link);
}

function fetchRSSFeed() {
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
      griditem.innerHTML = "";
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
      let descriptionElement = document.createElement("div");
      descriptionElement.className = "RSS-desc";
      descriptionElement.innerHTML = item["description"];

      let itemElement = document.createElement("div");
      itemElement.className = "RSS-card";
      itemElement.innerHTML = `
        <div class="RSS-footer"><a href="${item["link"]}">${item["title"]}</a><p>${dateString}</p></div>
      `;
      itemElement.appendChild(descriptionElement);
      griditem.appendChild(itemElement);
    }
  });
}

module.exports = {
  type: "module",
  init: initReader
}
