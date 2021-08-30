import Header from "../components/header";
import Footer from "../components/footer";

const Legal = () => (
  <div>
    <Header />

    <section className="bg-gray-50" id="pourquoi-mano">
      <div className="px-5 py-12 lg:py-24 md:container">
        <div className="mb-20 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            Éditeur du site
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            Direction du Numérique des ministères sociaux Ministère des solidarités et de la santé
            39-43 Quai André Citroën 75739 Paris Cedex 15
          </p>
        </div>
        <div className="mb-20 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            Directeur de la publication
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            Madame Hélène BRISSET, Directrice du Numérique des ministères sociaux
          </p>
        </div>
        <div className="mb-20 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            Hébergement du site
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            Ce site est hébergé par :
            <br />
            Microsoft Azure, 37-39 Quai du Président Roosevelt 92130 Issy les Moulineaux
          </p>
        </div>
        <div className="mb-20 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            Accessibilité
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous
            tâchons de rendre ce site accessible à toutes et à tous.{" "}
          </p>
        </div>
        <div className="mb-20 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            Signaler un dysfonctionnement
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou
            une fonctionnalité du site, merci de nous en faire part. Si vous n’obtenez pas de
            réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou une
            demande de saisine au Défenseur des droits.
          </p>
        </div>
        <div className="mb-20 text-center md:mx-auto md:w-8/12">
          <h3 className="mb-5 text-2xl font-semibold text-center text-black md:text-3xl lg:text-4xl">
            En savoir plus
          </h3>
          <p className="text-sm text-gray-600 md:text-base">
            Pour en savoir plus sur la politique d’accessibilité numérique de l’État :
            <a href="http://references.modernisation.gouv.fr/accessibilite-numerique">
              http://references.modernisation.gouv.fr/accessibilite-numerique
            </a>
          </p>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Legal;
