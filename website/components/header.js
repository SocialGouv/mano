import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

import { HiMenu } from "react-icons/hi";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.addEventListener("click", () => setIsOpen(false));
  });

  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/logo-green.png" />
        <title>
          Mano | Un service gratuit dédié aux professionnels de maraude et de lieux d’accueil.
        </title>
      </Head>
      <header className="z-20 flex items-center justify-between w-full px-4 py-5 bg-white border-b md:px-6 border-shamrock-50">
        <a className="flex items-center" href="/">
          <img className="w-10 mr-3" src="/logo-green.png" alt="logo" />
          <p className="text-2xl font-medium text-black">Mano</p>
        </a>
        {/* Mobile */}
        <button className="block lg:hidden">
          <HiMenu
            className="text-2xl text-black"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
          />
        </button>
        <div
          className={`fixed inset-y-0 right-0 lg:justify-end transform shadow-xl lg:shadow-none lg:transform-none lg:w-auto lg:relative lg:border-0 transition-transform z-10 flex flex-col items-start bg-white border-t-4 border-shamrock-400 lg:space-x-6 lg:items-center lg:flex-row w-72 md:w-96 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}>
          <MenuLink name="MANO, à quoi ça sert ?" target="/#pourquoi-mano" />
          <MenuLink name="La protection des données" target="/#la-protection-des-donnees" />
          <MenuLink name="Qui sommes nous ?" target="/#qui-sommes-nous" />
          <MenuLink name="Ils nous font confiance" target="/#ils-nous-font-confiance" />
          {/* <MenuLink name="Ils nous apprécient" target="/#ils-nous-apprecient" /> */}
          <MenuLink name="Nous contacter" target="/#contact" />
          <MenuLink name="FAQ" target="/faq" />
          <MenuLink
            full
            name="Se connecter"
            target="https://dashboard-mano.fabrique.social.gouv.fr/auth"
          />
        </div>
      </header>
    </>
  );
}

const MenuLink = ({ name, target = "#", full = false }) => (
  <Link href={target}>
    <a
      className={`w-full p-4 text-sm font-medium text-black transition-all opacity-50 lg:w-auto lg:text-xs lg:p-0 hover:opacity-100 ${
        full && "hidden lg:block rounded-lg lg:px-4 lg:py-2 text-white br-4 bg-shamrock-500 "
      }`}>
      {name}
    </a>
  </Link>
);
