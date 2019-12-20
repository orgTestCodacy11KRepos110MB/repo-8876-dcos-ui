import PropTypes from "prop-types";
import * as React from "react";

class ToggleValue extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      toggled: false
    };
  }

  render() {
    const { toggled } = this.state;
    const { primaryValue, secondaryValue } = this.props;

    return (
      <span
        className="toggle-value"
        onClick={() => this.setState({ toggled: !toggled })}
      >
        {toggled ? secondaryValue : primaryValue}
      </span>
    );
  }
}

ToggleValue.propTypes = {
  primaryValue: PropTypes.string.isRequired,
  secondaryValue: PropTypes.string.isRequired
};

export default ToggleValue;