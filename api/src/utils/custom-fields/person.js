const personFields = [
  { name: "user", type: "text", label: "", encrypted: true, importable: false, filterable: false },
  { name: "name", type: "text", label: "Nom prénom ou Pseudonyme", encrypted: true, importable: true, filterable: true },
  { name: "otherNames", type: "text", label: "Autres pseudos", encrypted: true, importable: true, filterable: true },
  {
    name: "gender",
    type: "enum",
    label: "Genre",
    encrypted: true,
    importable: true,
    filterable: true,
    options: ["Aucun", "Homme", "Femme", "Homme transgenre", "Femme transgenre", "Non binaire", "Autre"],
  },
  { name: "birthdate", type: "date", label: "Date de naissance", encrypted: true, importable: true, filterable: true },
  { name: "description", type: "textarea", label: "Description", encrypted: true, importable: true, filterable: true },
  { name: "alertness", type: "boolean", label: "Personne très vulnérable", encrypted: true, importable: true, filterable: true },
  { name: "wanderingAt", type: "date", label: "En rue depuis le", encrypted: true, importable: true, filterable: true },
  { name: "phone", type: "text", label: "Téléphone", encrypted: true, importable: true, filterable: true },
  { name: "email", type: "text", label: "Email", encrypted: true, importable: true, filterable: true },
  { name: "assignedTeams", type: "multi-choice", label: "Équipes en charge", encrypted: true, importable: true, filterable: false },
  { name: "_id", label: "", encrypted: false, importable: false, filterable: false },
  { name: "organisation", label: "", encrypted: false, importable: false, filterable: false },
  { name: "followedSince", type: "date", label: "Suivi(e) depuis le / Créé(e) le", encrypted: true, importable: true, filterable: true },
  { name: "createdAt", type: "date", label: "", encrypted: false, importable: false, filterable: false },
  { name: "updatedAt", type: "date", label: "", encrypted: false, importable: false, filterable: false },
  {
    name: "outOfActiveList",
    type: "boolean",
    label: "Sortie de file active",
    encrypted: true,
    importable: true,
    options: ["Oui", "Non"],
    filterable: true,
  },
  { name: "outOfActiveListDate", type: "date", label: "Date de sortie de file active", encrypted: true, importable: true, filterable: true },
  { name: "documents", type: "files", label: "Documents", encrypted: true, importable: false, filterable: false },
  { name: "history", type: "history", label: "Historique", encrypted: true, importable: false, filterable: false },
];

const fieldsPersonsCustomizableOptions = [
  {
    name: "outOfActiveListReasons",
    type: "multi-choice",
    importable: true,
    label: "Motifs de sortie de file active",
    options: [
      "Relai vers autre structure",
      "Hébergée",
      "Décès",
      "Incarcération",
      "Départ vers autre région",
      "Perdu de vue",
      "Hospitalisation",
      "Reconduite à la frontière",
      "Autre",
    ],
    showInStats: true,
    enabled: true,
  },
];

const defaultMedicalCustomFields = [
  {
    name: "healthInsurances",
    type: "multi-choice",
    label: "Couverture(s) médicale(s)",
    enabled: true,
    options: ["Aucune", "Régime Général", "PUMa", "AME", "CSS", "Autre"],
    required: false,
    showInStats: true,
  },
  { name: "structureMedical", type: "text", label: "Structure de suivi médical", enabled: true, required: false, showInStats: true },
  {
    name: "consumptions",
    label: "Consommations",
    type: "multi-choice",
    options: [
      "Alcool",
      "Amphétamine/MDMA/Ecstasy",
      "Benzodiazépines",
      "Buprénorphine/Subutex",
      "Cocaïne",
      "Crack",
      "Cannabis",
      "Héroïne",
      "Lyrica",
      "Méthadone",
      "Moscantin/Skénan",
      "Tabac",
      "Tramadol",
    ],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "vulnerabilities",
    label: "Vulnérabilités",
    type: "multi-choice",
    options: ["Pathologie chronique", "Psychologique", "Injecteur", "Handicap"],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "caseHistoryTypes",
    label: "Catégorie d'antécédents",
    type: "multi-choice",
    options: [
      "Psychiatrie",
      "Neurologie",
      "Dermatologie",
      "Pulmonaire",
      "Gastro-enterologie",
      "Rhumatologie",
      "Cardio-vasculaire",
      "Ophtalmologie",
      "ORL",
      "Dentaire",
      "Traumatologie",
      "Endocrinologie",
      "Uro-gynéco",
      "Cancer",
      "Addiction alcool",
      "Addiction autres",
      "Hospitalisation",
    ],
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "caseHistoryDescription",
    label: "Informations complémentaires (antécédents)",
    type: "textarea",
    options: null,
    enabled: true,
    required: false,
    showInStats: true,
  },
];

const defaultSocialCustomFields = [
  {
    name: "personalSituation",
    type: "enum",
    label: "Situation personnelle",
    enabled: true,
    options: ["Aucune", "Homme isolé", "Femme isolée", "En couple", "Famille", "Famille monoparentale", "Mineur", "Autre"],
    required: false,
    showInStats: true,
  },
  {
    name: "nationalitySituation",
    type: "enum",
    label: "Nationalité",
    enabled: true,
    options: ["Hors UE", "UE", "Française", "Apatride"],
    required: false,
    showInStats: true,
  },
  {
    name: "hasAnimal",
    type: "yes-no",
    label: "Avec animaux",
    enabled: true,
    options: ["Oui", "Non"],
    required: false,
    showInStats: true,
  },
  {
    name: "structureSocial",
    type: "text",
    label: "Structure de suivi social",
    enabled: true,
    required: false,
    showInStats: true,
  },
  {
    name: "employment",
    type: "enum",
    label: "Emploi",
    enabled: true,
    options: ["DPH", "CDD", "CDDI", "CDI", "Interim", "Bénévolat", "Sans activité", "Étudiant", "Non déclaré", "Autre"],
    required: false,
    showInStats: true,
  },
  {
    name: "resources",
    type: "multi-choice",
    label: "Ressources",
    enabled: true,
    options: [
      "SANS",
      "ARE",
      "RSA",
      "AAH",
      "ADA",
      "ATA",
      "Retraite",
      "Salaire",
      "Allocation Chômage",
      "Indemnités journalières",
      "Mendicité",
      "Aide financière CCAS",
      "Revenus de Formations",
      "Pension d'invalidité",
      "Contrat d'engagement jeune",
      "Contrat jeune majeur",
      "Autre",
    ],
    required: false,
    showInStats: true,
  },
  { name: "address", type: "yes-no", label: "Hébergement", enabled: true, options: ["Oui", "Non"], required: false, showInStats: true },
  {
    name: "addressDetail",
    type: "enum",
    label: "Type d'hébergement",
    enabled: true,
    options: [
      "Logement",
      "Hébergement association",
      "Chez un tiers",
      "Mise à l'abri",
      "Logement accompagné",
      "Urgence",
      "Insertion",
      "Hôtel",
      "Autre",
    ],
    required: false,
    showInStats: true,
    allowCreateOption: true,
  },
  {
    name: "reasons",
    type: "multi-choice",
    label: "Motif de la situation en rue",
    enabled: true,
    options: [
      "Sortie d'hébergement",
      "Expulsion de logement/hébergement",
      "Départ du pays d'origine",
      "Départ de région",
      "Rupture familiale",
      "Perte d'emploi",
      "Sortie d'hospitalisation",
      "Problème de santé",
      "Sortie d'ASE",
      "Sortie de détention",
      "Rupture de soins",
      "Autre",
    ],
    required: false,
    showInStats: true,
  },
];

module.exports = {
  personFields,
  fieldsPersonsCustomizableOptions,
  defaultSocialCustomFields,
  defaultMedicalCustomFields,
};
