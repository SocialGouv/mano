const defaultTerritoryEncryptedFields = [
  {
    name: "name",
    label: "Nom",
    type: "text",
    enabled: true,
    required: true,
    showInStats: false,
  },
  {
    name: "perimeter",
    label: "Périmètre",
    type: "text",
    enabled: true,
    required: false,
    showInStats: false,
  },
  {
    name: "types",
    label: "Types",
    type: "multi-choice",
    enabled: true,
    required: false,
    options: [
      "Lieu de conso",
      "Lieu de deal",
      "Carrefour de passage",
      "Campement",
      "Lieu de vie",
      "Prostitution",
      "Errance",
      "Mendicité",
      "Loisir",
      "Rassemblement communautaire",
      "Historique",
      "Station de métro",
    ],
    showInStats: true,
  },
  {
    name: "user",
    label: "Utilisateur",
    type: "text", // uuid
    enabled: true,
    required: true,
    showInStats: false,
  },
];

module.exports = {
  defaultTerritoryEncryptedFields,
};
