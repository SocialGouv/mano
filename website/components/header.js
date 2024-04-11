import Head from "next/head";
import { useEffect, useState } from "react";
import { HiMenu } from "react-icons/hi";

export default function Header({ showMenu, setShowMenu }) {
  const [connexionUrl, setConnexionUrl] = useState("https://espace-mano.sesan.fr/auth");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.hostname === "preprod-mano.sesan.fr") {
        setConnexionUrl("https://preprod-espace-mano.sesan.fr/auth");
      } else if (window.location.hostname === "localhost") {
        setConnexionUrl("http://localhost:8083/auth");
      }
    }
  }, []);

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/logo.png" />
        <title>Mano | Un service gratuit dédié aux professionnel·le·s de maraude et de lieux d’accueil.</title>
      </Head>
      <header className="text-gray-700 sticky top-0 z-50 bg-white flex gap-6 xl:gap-8 p-2 w-full border-b border-gray-300 items-center shadow mb-8">
        <img src="/logo.png" alt="Logo" className="w-12 h-12 cursor-pointer" onClick={() => (window.location.href = "/")} />
        <div
          className="text-2xl md:hidden block cursor-pointer"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          Mano
        </div>
        <div className="hidden md:block grow lg:text-base text-sm">
          <ul className="md:flex flex-row gap-8 hidden">
            <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer`}>
              <a href="/#comment-ça-marche">Comment ça marche</a>
            </li>
            <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer`}>
              <a href="/#sécurité">Sécurité des données</a>
            </li>
            <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer`}>
              <a href="/#confiance">Ils nous font confiance</a>
            </li>
            <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer`}>
              <a href="/#qui-sommes-nous">Qui sommes nous</a>
            </li>
          </ul>
        </div>
        <a
          href={connexionUrl}
          className="hidden md:inline-flex w-full cursor-pointer justify-center rounded-md border border-transparent bg-mano px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-mano focus:outline-none focus:ring-2 focus:ring-mano focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30 sm:ml-3 sm:w-auto"
        >
          Se&nbsp;connecter
        </a>

        <div className="md:hidden flex grow justify-end mr-2">
          <HiMenu
            className="text-2xl text-black"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          />
        </div>
        {showMenu && (
          <div className="absolute top-16 right-0 bg-white shadow w-full">
            <ul className="flex flex-col">
              <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer p-4 border-b`}>
                <a
                  href="#comment-ça-marche"
                  onClick={() => {
                    setShowMenu(false);
                  }}
                >
                  Comment ça marche
                </a>
              </li>
              <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer p-4 border-b`}>
                <a
                  href="#sécurité"
                  onClick={() => {
                    setShowMenu(false);
                  }}
                >
                  Sécurité des données
                </a>
              </li>
              <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer p-4 border-b`}>
                <a
                  href="#confiance"
                  onClick={() => {
                    setShowMenu(false);
                  }}
                >
                  Ils nous font confiance
                </a>
              </li>
              <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer p-4 border-b`}>
                <a
                  href="#qui-sommes-nous"
                  onClick={() => {
                    setShowMenu(false);
                  }}
                >
                  Qui sommes nous
                </a>
              </li>
              <li className={`hover:underline decoration-mano underline-offset-2 cursor-pointer p-4 border-b`}>
                <a
                  href="#"
                  onClick={() => {
                    setShowMenu(false);
                  }}
                >
                  Se connecter
                </a>
              </li>
            </ul>
          </div>
        )}
      </header>
    </>
  );
}
