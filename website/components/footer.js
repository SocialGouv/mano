import { HiOutlineMail } from "react-icons/hi";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Footer() {
  const nathan = "bmF0aGFuLmZyYWRpbi5tYW5vQGdtYWlsLmNvbQ==";
  const guillaume = "Zy5kZW1pcmhhbkBhdXJvcmUuYXNzby5mcg==";
  const melissa = "bS5zYWl0ZXIubWFub0BnbWFpbC5jb20=";
  const yoann = "eWtpdHRlcnkubWFub0BnbWFpbC5jb20=";
  const [emailGuillaume, setEmailGuillaume] = useState("");
  const [emailNathan, setEmailNathan] = useState("");
  const [emailMelissa, setEmailMelissa] = useState("");
  const [emailYoann, setEmailYoann] = useState("");

  const year = new Date().getFullYear();

  useEffect(() => {
    setEmailGuillaume(window.atob(guillaume));
    setEmailNathan(window.atob(nathan));
    setEmailMelissa(window.atob(melissa));
    setEmailYoann(window.atob(yoann));
  }, []);
  return (
    <>
      <section className="bg-shamrock-400 flex justify-center" id="contact">
        <div className="px-5 py-12 lg:py-24 lg:mx-24 md:container md:grid md:grid-cols-12">
          <div className="mb-8 text-center lg:col-span-5 col-span-full flex flex-col justify-center">
            <h3 className="mb-2 text-xl font-semibold text-white">
              Nous contacter
            </h3>
            <p className="mb-8 text-sm text-white">
              Que vous ayez besoin d’un renseignement complémentaire ou d’une
              présentation complète ou que vous soyez déjà convaincus, nous
              serons ravis d’échanger avec vous
            </p>
          </div>
          <div className="grid grid-cols-1 gap-10 lg:col-span-8 lg:col-start-7 col-span-full">
            <div>
              <p className="mb-3  text-sm text-white text-center">
                Pour toutes questions sur les fonctionnalités de MANO, pour une
                présentation complète en présentiel ou commencer à utiliser
                l'outil{`\u00A0`}:<br />
                <span className=" block text-base  mt-3 font-medium ">
                  Nathan, Mélissa et Yoann
                  <br />
                  chargés de déploiement
                </span>
              </p>
              <button
                className="mx-auto p-4 px-12 space-x-2 text-white transition-all bg-white flex-center rounded-xl bg-opacity-10 hover:bg-opacity-30"
                onClick={() => {
                  window.location.href =
                    "mailto:" + window && window.atob(nathan);
                }}
              >
                <HiOutlineMail className="text-lg" />
                <span
                  suppressHydrationWarning
                  className="text-base font-medium"
                >
                  {emailNathan}
                </span>
              </button>
              <button
                className="mx-auto p-4 px-12 mt-2 space-x-2 text-white transition-all bg-white flex-center rounded-xl bg-opacity-10 hover:bg-opacity-30"
                onClick={() => {
                  window.location.href =
                    "mailto:" + window && window.atob(melissa);
                }}
              >
                <HiOutlineMail className="text-lg" />
                <span
                  suppressHydrationWarning
                  className="text-base font-medium"
                >
                  {emailMelissa}
                </span>
              </button>
              <button
                className="mx-auto p-4 px-12 mt-2 space-x-2 text-white transition-all bg-white flex-center rounded-xl bg-opacity-10 hover:bg-opacity-30"
                onClick={() => {
                  window.location.href =
                    "mailto:" + window && window.atob(yoann);
                }}
              >
                <HiOutlineMail className="text-lg" />
                <span
                  suppressHydrationWarning
                  className="text-base font-medium"
                >
                  {emailYoann}
                </span>
              </button>
            </div>
            <div>
              <p className="mb-2 text-sm text-center text-white">
                Pour toute question plus générale sur le projet ou pour établir
                un partenariat avec un autre service :
                <span className=" block text-base  mt-3 font-medium ">
                  Guillaume Demirhan,
                  <br />
                  porteur du projet
                </span>
              </p>
              <button
                className="mx-auto p-4 px-12 space-x-2 text-white transition-all bg-white flex-center rounded-xl bg-opacity-10 hover:bg-opacity-30"
                onClick={() => {
                  window.location.href =
                    "mailto:" + window && window.atob(guillaume);
                }}
              >
                <HiOutlineMail className="text-lg" />
                <span
                  suppressHydrationWarning
                  className="text-base font-medium"
                >
                  {emailGuillaume}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-shamrock-500">
        <div className="flex flex-col items-center justify-center p-8 md:container md:flex-row md:justify-between">
          <a className="w-20 mb-10 md:mb-0" href="/">
            <img
              className="object-contain w-full h-full"
              src="/logo-white.png"
              alt=""
            />
          </a>
          <p className="text-xs text-white opacity-40">
            <Link href="/legal">
              <a>Mentions légales</a>
            </Link>
          </p>
          <p className="text-xs text-white opacity-40">
            &copy; 2021-{year} Mano - Tous droits réservés
          </p>
        </div>
      </section>
    </>
  );
}
