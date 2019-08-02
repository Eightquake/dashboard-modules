/**
  * A plugin to read a RSS feed and parse it, showing the items in a list on the dashboard.\n
  * It does not update automatically, but has a button for refreshing the feed. It also has a button for opening either the feed link externally or a link that can be defined in the detail.
  * @todo Update the element regularly so the timestamps are correct all the time. Update the feed once in a while and check build-date or similar to determine if it should continue parsing the feed?
  * @see {@link https://github.com/Eightquake/dashboard-modules} for more information and the actual file as it isn't in this repo.
  * @category Plugins
  * @module RSSfeedreader
  * @author Victor Davidsson
  * @version 0.5.0
  */


let FeedParser = require('feedparser');
let request = require('request');

let detail, gridelement, griditem;

/* RelativeTimeFormat to convert the dates from the API into a nice looking text, something like 2 hours ago */
const rtf = new Intl.RelativeTimeFormat('sv', {numeric: 'auto'});

function initReader(detailArg, gridElementArg, detailName) {
  detail = detailArg;
  gridelement = gridElementArg;

  let topBar = document.createElement("div");
  topBar.classList.add("RSS-top-bar", "drag-handle");
  /* If possible, link to the forumLink instead of the actual RSS feed */
  let topBarLink = detail.external_link?detail.external_link:detail.link;
  topBar.innerHTML = `
    <p>${detail.name}</p><a title="${topBarLink}" href="${topBarLink}"><i class="fas fa-external-link-alt"></i></a>
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
      line-height:1.7em;
      text-align:right;
      box-shadow:0 4px 5px -3px #999;
      background-color:#9BC3E8;
    }
    div#${name} .RSS-top-bar p {
      float:left;
      margin:0 0 0 0.5em;
      line-height:2em;
      color:#666;
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
    div#${name} .RSS-desc div *::selection, div#${name} .RSS-footer *::selection {
      color:#FFF;
      background-color:#999;
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
  document.head.appendChild(link);
}

function fetchRSSFeed() {
  let rssRequest = request(detail.link);
  let feed = new FeedParser();

  rssRequest.on('error', function(error) {
    global.problem.emit("error", "The request for the RSS feed encountered an error.<br>" + error);
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
        dateString = "mindre än en timme sedan";
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
