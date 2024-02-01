import Header from "../components/header";
import Footer from "../components/footer";

const Stats = () => {
  let src = "https://metabase-mano.fabrique.social.gouv.fr/public/dashboard/825cc4ad-b502-4483-aa78-c2af56032bc9";
  if (typeof window !== "undefined") {
    if (window.location.hostname === "preprod-mano.sesan.fr") {
      url = "http://preprod-metabase-mano.sesan.fr/public/dashboard/d30b0c39-6e14-4bbb-9e64-a367a6fdb073";
    }
    if (window.location.hostname === "mano.sesan.fr") {
      url = "TODO";
    }
  }
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
        allowtransparency
      ></iframe>
      <Footer />
    </div>
  );
};

export default Stats;
