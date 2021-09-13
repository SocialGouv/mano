/* eslint-disable no-extend-native */
String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};
