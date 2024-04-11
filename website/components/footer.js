export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-mano mt-16 border text-white p-8">
      <ul className="flex md:flex-row flex-col gap-6 text-base xl:text-base md:text-sm">
        <li>
          <a href={"https://espace-mano.sesan.fr/legal.pdf"} target="_blank" className="hover:underline">
            Accessibilité : non conforme
          </a>
        </li>
        <li>
          <a href={"https://espace-mano.sesan.fr/legal.pdf"} target="_blank" className="hover:underline">
            Mentions légales
          </a>
        </li>
        <li>
          <a href={"https://espace-mano.sesan.fr/cgu.pdf"} target="_blank" className="hover:underline">
            Conditions générales d'utilisation
          </a>
        </li>
        <li>
          <a href={"/stats"} className="hover:underline">
            Statistiques
          </a>
        </li>
        <li>
          <a href={"https://espace-mano.sesan.fr/privacy.pdf"} target="_blank" className="hover:underline">
            Politique de confidentialité
          </a>
        </li>
      </ul>
      <div className="text-xs mt-4">2020-{year}, Mano - Tous droits réservés </div>
    </footer>
  );
}
