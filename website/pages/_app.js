import "tailwindcss/tailwind.css";
import "style/default.css";
import React from "react";
import App from "next/app";
import Head from "next/head";
import { init } from "@socialgouv/matomo-next";

const MATOMO_URL = "https://matomo.fabrique.social.gouv.fr/";
const MATOMO_SITE_ID = "44";
class MyApp extends App {
  componentDidMount() {
    init({ url: MATOMO_URL, siteId: MATOMO_SITE_ID });
  }
  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <Head>
          <meta key='viewport' name='viewport' content='width=device-width, initial-scale=1' />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }
}

export default MyApp;
