import { useState } from "react";
import Header from "../components/header";
import Footer from "../components/footer";
import Web from "../components/faq-web";
import Mobile from "../components/faq-mobile";

const Faq = () => {
  return (
    <div>
      <Header />
      <div className="container px-4 md:px-0">
        <div className="w-full py-10 md:mx-auto md:w-10/12 md:py-24">
          <h1 className="mb-10 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            Foire aux questions (FAQ)
          </h1>

          <Tabs />
        </div>
      </div>
      <Footer />
    </div>
  );
};

const Tabs = () => {
  const [tab, setTab] = useState("web");

  const activeStyle = "bg-white text-shamrock-400";
  const inactiveStyle = "text-gray-400";

  const Tab = ({ name, title }) => {
    const key = name.toLowerCase();
    return (
      <button
        className={`md:px-10 px-4 py-2 md:text-sm text-xs font-medium rounded-full ${
          tab === key ? activeStyle : inactiveStyle
        }`}
        onClick={() => setTab(key)}>
        {title}
      </button>
    );
  };

  return (
    <>
      <div className="flex p-1 mx-auto mb-10 bg-gray-100 rounded-full w-max">
        <Tab name="Web" title="Sur l’interface web" />
        <Tab name="Mobile" title="Sur l’application Android" />
      </div>

      <div>
        {tab === "web" && <Web />}
        {tab === "mobile" && <Mobile />}
      </div>
    </>
  );
};

export default Faq;
