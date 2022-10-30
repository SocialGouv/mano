import Header from "../components/header";
import Footer from "../components/footer";

const Stats = () => (
  <div>
    <Header />
    <iframe
      src='https://metabase-mano.fabrique.social.gouv.fr/public/dashboard/825cc4ad-b502-4483-aa78-c2af56032bc9'
      frameBorder='0'
      width='1000'
      height='1500'
      style={{
        display: "block",
        margin: "0 auto",
        padding: "2rem 0",
      }}
      allowtransparency></iframe>
    <Footer />
  </div>
);

export default Stats;
