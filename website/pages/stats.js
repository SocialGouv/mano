import Header from "../components/header";
import Footer from "../components/footer";
import { useEffect, useState } from "react";

const Stats = () => {
  const [src, setSrc] = useState("https://preprod-metabase-mano.sesan.fr/public/dashboard/d30b0c39-6e14-4bbb-9e64-a367a6fdb073");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "mano.sesan.fr") {
        setSrc("https://metabase-mano.sesan.fr/public/dashboard/dbd4c9fc-9f6d-4386-8dce-d923ae8458de");
      }
    }
  }, []);

  return (
    <div>
      <Header />
      <iframe
        src={src}
        frameBorder="0"
        width="1000"
        height="1500"
        style={{
          display: "block",
          margin: "0 auto",
          padding: "2rem 0",
        }}
        allowtransparency="true"
      ></iframe>
      <Footer />
    </div>
  );
};

export default Stats;
