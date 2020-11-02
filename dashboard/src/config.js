const forceProd = false;

let apiURL = "https://selego-api.azurewebsites.net";
if (window.location.href.indexOf("localhost") !== -1 || window.location.href.indexOf("127.0.0.1") !== -1) {
  apiURL = "http://localhost:8082";
}

export { apiURL };
