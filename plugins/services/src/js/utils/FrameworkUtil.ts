import Util from "#SRC/js/utils/Util";
import DateUtil from "#SRC/js/utils/DateUtil";

import ServiceImages from "../constants/ServiceImages";

// You might be tempted to merge FrameworkUtil into ServiceUtil, but that will
// cause a circular dependency with ServiceUtil and struct/Service.
const FrameworkUtil = {
  getImageSizeFromImagesObject(images, size) {
    if (
      images == null ||
      images[`icon-${size}`] == null ||
      images[`icon-${size}`].length === 0
    ) {
      return null;
    }

    return images[`icon-${size}`];
  },

  /**
   * Get meta data from framework labels
   * @param {{DCOS_PACKAGE_METADATA:string}} labels
   * @returns {object} metadata
   */
  getMetadataFromLabels(labels) {
    if (
      Util.findNestedPropertyInObject(labels, "DCOS_PACKAGE_METADATA.length") ==
      null
    ) {
      return {};
    }

    // Extract content of the DCOS_PACKAGE_METADATA label
    try {
      const dataAsJsonString = global.atob(labels.DCOS_PACKAGE_METADATA);

      return JSON.parse(dataAsJsonString);
    } catch (error) {
      return {};
    }
  },

  /**
   * Get service icon images from images object
   * @param  {Object} images containing urls for the different image sizes
   * @return {Object}        containing urls for images. Returns default images
   * if all is not available in given object.
   */
  getServiceImages(images) {
    return ["small", "medium", "large"].every(
      size => this.getImageSizeFromImagesObject(images, size) != null
    )
      ? images
      : ServiceImages.NA_IMAGES;
  },

  /**
   * Return a warning or an error label
   * if the pacakge has cosmosPackage been updated soon.
   * @param {object} cosmosPackage The cosmos package to check.
   * @param {Boolean} withLabel Indicates whether we want the "Last Updated: " label or not.
   * @returns {null | String | React.ReactNode} Null or string or an HTML element saying when was the last update of this package
   */
  getLastUpdated(cosmosPackage) {
    try {
      // This looks like magic, but we are only decoding the package configuration into a string,
      // and then finding the PACKAGE_BUILD_TIME_STR property.
      return DateUtil.msToUTCDay(
        window
          .atob(cosmosPackage.marathon.v2AppMustacheTemplate)
          .match(/PACKAGE_BUILD_TIME_STR": "(.*)"/)[1]
      );
    } catch (_e) {
      return null;
    }
  }
};

export default FrameworkUtil;