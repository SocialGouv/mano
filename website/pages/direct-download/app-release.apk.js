import { HiOutlineDownload } from "react-icons/hi";
import Header from "../../components/header";
import Footer from "../../components/footer";
import { mobileAppVersion } from "../../package.json";
import { useEffect } from "react";

export default function Download() {
  const url = `https://github.com/mano-sesan/mano/releases/download/m${mobileAppVersion}/app-release.apk`;

  useEffect(() => {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "app-release.apk";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  return (
    <div>
      <Header />
      <div className="w-full h-18"></div>
      <section className="relative h-[50vh] flex items-center">
        <a
          className="mx-auto py-4 px-12 space-x-2 text-white transition-all bg-shamrock-400 rounded-xl bg-opacity-100 hover:bg-opacity-30 inline-flex justify-between items-center text-center"
          download
          href={url}
        >
          <HiOutlineDownload className="text-lg mr-4 block" />
          <span suppressHydrationWarning className="text-base font-medium">
            Télécharger
            <br />v{mobileAppVersion}
          </span>
        </a>
      </section>
      <Footer />
    </div>
  );
}
