import { HiOutlineDownload } from "react-icons/hi";
import Header from "../components/header";
import Footer from "../components/footer";
import { mobileAppVersion } from "../package.json";

export default function Download() {
  return (
    <div>
      <Header />
      <div className="w-full h-18"></div>
      <section className="relative h-[50vw] flex items-center">
        <a
          className="mx-auto py-4 px-12 space-x-2 text-white transition-all bg-shamrock-400 rounded-xl bg-opacity-100 hover:bg-opacity-30 inline-flex justify-between items-center text-center"
          download
          href={`https://github.com/SocialGouv/mano/releases/download/m${mobileAppVersion}/app-release.apk`}>
          <HiOutlineDownload className="text-lg mr-4 block" />
          <span suppressHydrationWarning className="text-base font-medium">
            Télécharger
            <br />v{mobileAppVersion}
          </span>
        </a>
      </section>
      <Footer skipFirstParagraph />
    </div>
  );
}
