import * as React from "react";
import { mount } from "enzyme";

import ConfigurationMapDurationValue from "../ConfigurationMapDurationValue";

describe("ConfigurationMapDurationValue", () => {
  it("assumes default millisecond scale", () => {
    const instance = mount(<ConfigurationMapDurationValue value={1234} />);

    const contentText = instance.find(".configuration-map-value").text().trim();

    expect(contentText).toEqual("1234 ms (1 sec, 234 ms)");
  });

  it("is configured for second scale", () => {
    const instance = mount(
      <ConfigurationMapDurationValue units="sec" value={130} />
    );

    const contentText = instance.find(".configuration-map-value").text().trim();

    expect(contentText).toEqual("130 sec (2 min, 10 sec)");
  });

  it("removes redundant components", () => {
    const instance = mount(
      <ConfigurationMapDurationValue units="sec" value={30} />
    );

    const contentText = instance.find(".configuration-map-value").text().trim();

    expect(contentText).toEqual("30 sec");
  });

  it("renders `defaultValue` if empty", () => {
    const instance = mount(
      <ConfigurationMapDurationValue defaultValue="-" value={null} />
    );

    const contentText = instance.find(".configuration-map-value").text().trim();

    expect(contentText).toEqual("-");
  });
});
