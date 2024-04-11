import { HiOutlineDownload } from "react-icons/hi";
import Header from "../components/header";
import Footer from "../components/footer";
import { mobileAppVersion } from "../package.json";

export default function Download() {
  return (
    <>
      <Header />
      <section className="relative h-[40vh] flex items-center">
        <a
          className="mt-12 mx-auto py-4 px-12 space-x-2 text-white transition-all bg-mano rounded bg-opacity-100 hover:bg-opacity-30 inline-flex justify-between items-center text-center"
          download
          href={`https://github.com/mano-sesan/mano/releases/download/m${mobileAppVersion}/app-release.apk`}
        >
          <HiOutlineDownload className="text-lg mr-4 block" />
          <span suppressHydrationWarning className="text-base font-medium">
            Télécharger Mano
            <br />v{mobileAppVersion}
          </span>
        </a>
      </section>
      <img src="/mano-tel.png" alt="Screenshot" className="mx-auto w-[600px] pt-12" />
      <Footer />
    </>
  );
}
