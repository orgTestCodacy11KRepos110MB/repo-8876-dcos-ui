import * as React from "react";
import renderer from "react-test-renderer";

import LeaderGrid from "../LeaderGrid";

const master = {
  hostPort: "127.1.2.3:8080",
  version: "2.9.1",
  electedTime: 1532340694.04573,
  startTime: 1232340694.04573,
  region: "us-east-1",
};

describe("LeaderGrid", () => {
  beforeEach(() => {
    Date.now = jest.fn(() => 1542340694);
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  it("renders with running status", () => {
    expect(
      renderer.create(<LeaderGrid leader={master} />).toJSON()
    ).toMatchSnapshot();
  });
});
