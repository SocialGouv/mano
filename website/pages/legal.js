import Header from "../components/header";
import Footer from "../components/footer";

const Legal = () => (
  <div>
    <Header />

    <div className="p-8 container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Mentions légales – Mano</h1>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Éditeur de la plateforme</h2>
        <address className="mt-4 italic">
          Direction du Numérique des ministères sociaux
          <br />
          Ministère des solidarités et de la santé
          <br />
          39-43 Quai André Citroën
          <br />
          75739 Paris Cedex 15
        </address>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Directrice de la publication</h2>
        <p className="mt-4">Madame Anne JEANJEAN, Directrice du Numérique des ministères sociaux</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Hébergement de la plateforme</h2>
        <address className="mt-4 italic">
          Microsoft Azure
          <br />
          37-39 Quai du Président Roosevelt
          <br />
          92130 Issy les Moulineaux
        </address>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Accessibilité</h2>
        <p className="mt-4">
          La conformité aux normes d’accessibilité numérique est un objectif ultérieur mais nous tâchons de rendre cette plateforme accessible à
          toutes et tous.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Signaler un dysfonctionnement</h2>
        <p className="mt-4">
          Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une fonctionnalité de la plateforme, merci de nous en
          faire part.
          <br />
          Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou une demande de saisine au
          Défenseur des droits.
        </p>
      </section>
    </div>

    <Footer />
  </div>
);

export default Legal;
