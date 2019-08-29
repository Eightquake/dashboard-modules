/*eslint-disable no-cond-assign */

import React from "react";
import FeedParser from "feedparser";
import request from "request";

import "./RSSfeedreader.css";

const rtf = new Intl.RelativeTimeFormat("sv", { numeric: "auto" });

export default class RSSfeedreader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cardList: []
    };
  }
  componentDidMount() {
    this._fetchData();
    this.itemID = setInterval(() => {
      this._updateTexts();
    }, 60000);
  }
  componentWillUnmount() {
    clearInterval(this.itemID);
  }
  _fetchData = () => {
    let rssRequest = request(this.props.detail.link);
    let feed = new FeedParser();

    rssRequest.on("error", function(error) {
      global.problem.emit(
        "error",
        "The request for the RSS feed encountered an error.\n" + error
      );
    });
    rssRequest.on("response", function(resp) {
      let stream = this;

      if (resp.statusCode !== 200) {
        this.emit(
          "error",
          new Error(
            `Bad status code from the request - expected 200 but got ${resp.statusCode}`
          )
        );
      } else {
        stream.pipe(feed);
      }
    });
    feed.on("error", function(error) {
      global.problem.emit(
        "error",
        "The parser for the RSS feed encountered an error.\n" + error
      );
    });

    feed.on("readable", function() {
      let stream = this;
      let item;

      let itemArray = [];

      while ((item = stream.read())) {
        itemArray.push({
          link: item.link,
          title: item.title,
          description: item.description,
          pubDate: item.pubDate
        });
      }
      this._updateTexts(itemArray);
    });
  };
  _updateTexts = (itemArray = this.state.cardList) => {
    let cards = [];

    itemArray.forEach(element => {
      let pubDate = new Date(element.pubDate);
      let itemAge = Math.round((pubDate - new Date()) / 3600000);
      let dateString;
      if (itemAge >= -1) {
        dateString = "mindre än en timme sedan";
      } else {
        dateString = rtf.format(itemAge, "hours");
      }
      cards.push({
        dateString,
        link: element.link,
        title: element.title,
        description: element.description
      });
    });
    this.setState({ cardList: cards });
  };
  render() {
    return (
      <div className="RSSfeedreader">
        <div className="RSS-top-bar drag-handle">
          <p>{this.props.detail.name}</p>
          <a
            title={this.props.detail.external_link || this.props.detail.link}
            href={this.props.detail.external_link || this.props.detail.link}
          >
            <i className="fas fa-external-link-alt" />
          </a>
          <i className="fas fa-redo" onClick={this._fetchData} />
        </div>
        <div className="RSS-card-list">
          {this.state.cardList.map((element, index) => (
            <div className="RSS-card">
              <div className="RSS-footer">
                <a href={element.link}>{element.title}</a>
                <p>{element.dateString}</p>
                <div className="RSS-desc">{element.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
