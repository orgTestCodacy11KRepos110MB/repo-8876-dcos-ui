import classNames from "classnames";
import deepEqual from "deep-equal";
import PropTypes from "prop-types";
import React from "react";

import ValueTypes from "../../constants/ValueTypes";

var TimeSeriesLabel = React.createClass({
  displayName: "TimeSeriesLabel",

  propTypes: {
    colorIndex: PropTypes.number,
    currentValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    subHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    y: PropTypes.string
  },

  getDefaultProps() {
    return {
      y: ValueTypes.PERCENTAGE,
      colorIndex: 0
    };
  },

  shouldComponentUpdate(nextProps) {
    // If equal, do not update
    return !deepEqual(this.props, nextProps);
  },

  render() {
    var props = this.props;

    var percentageClassSet = classNames({
      hidden: props.y !== ValueTypes.PERCENTAGE
    });

    return (
      <div className="text-align-center">
        <span className="unit unit-primary">
          {props.currentValue}
          <sup className={percentageClassSet}>%</sup>
        </span>
        <span
          className={"h3 unit-label flush-top path-color-" + props.colorIndex}
        >
          {props.subHeading}
        </span>
      </div>
    );
  }
});

module.exports = TimeSeriesLabel;
