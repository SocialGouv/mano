import "tailwindcss/tailwind.css";
import "style/default.css";
import React from "react";
import App from "next/app";
import Head from "next/head";
class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <Head>
          <meta key="viewport" name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }
}

export default MyApp;
