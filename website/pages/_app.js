import "tailwindcss/tailwind.css";
import "style/default.css";
import React from "react";
import App from "next/app";
import { init } from "@socialgouv/matomo-next";

const MATOMO_URL = "https://matomo.fabrique.social.gouv.fr/";
const MATOMO_SITE_ID = "44";
class MyApp extends App {
  componentDidMount() {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }
  render() {
    const { Component, pageProps } = this.props;
    return <Component {...pageProps} />;
  }
}

export default MyApp;
