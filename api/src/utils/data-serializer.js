const { defaultMedicalFileCustomFields } = require("./custom-fields/medicalFile");
const { customFieldsPersonsMedicalBase, customFieldsPersonsSocialBase, fixedFieldsPersonsBase } = require("./custom-fields/person");

function serializeOrganisation(organisation) {
  return {
    _id: organisation._id,
    name: organisation.name,
    createdAt: organisation.createdAt,
    updatedAt: organisation.updatedAt,
    encryptionEnabled: organisation.encryptionEnabled,
    encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
    receptionEnabled: organisation.receptionEnabled,
    encryptedVerificationKey: organisation.encryptedVerificationKey,
    migrations: organisation.migrations,
    migrationLastUpdateAt: organisation.migrationLastUpdateAt,

    /* for family/groups */
    groupsEnabled: organisation.groupsEnabled,

    /* actions settings */
    categories: !!organisation.actionsGroupedCategories
      ? organisation.actionsGroupedCategories.reduce((flattenedCategories, group) => [...flattenedCategories, ...group.categories], [])
      : organisation.categories,
    actionsGroupedCategories: organisation.actionsGroupedCategories,

    /* services settings */
    groupedServices: organisation.groupedServices,
    services: !!organisation.groupedServices
      ? organisation.groupedServices.reduce((flattenedServices, group) => [...flattenedServices, ...group.services], [])
      : organisation.services,

    /* collaborations */
    collaborations: organisation.collaborations,

    /* custom fields consultations */
    consultations: organisation.consultations,
    /* custom fields observations */
    customFieldsObs: organisation.customFieldsObs,
    /* custom fields persons */
    customFieldsPersons: organisation.customFieldsPersons || defaultFieldsPersons,
    /* custom fields medical file */
    customFieldsMedicalFile: organisation.customFieldsMedicalFile || defaultMedicalFileCustomFields,

    // kept for retro-compatiblity only
    /* fixed fields persons */
    personFields: organisation.customFieldsPersons.find((group) => group.name === "Résumé")?.fields || fixedFieldsPersonsBase,
    /* custom fields persons */
    customFieldsPersonsSocial:
      organisation.customFieldsPersons.find((group) => group.name === "Informations sociales")?.fields || customFieldsPersonsSocialBase,
    customFieldsPersonsMedical:
      organisation.customFieldsPersons.find((group) => group.name === "Informations médicales")?.fields || customFieldsPersonsMedicalBase,

    /* custom fields persons: fields with customizavble options only */
    fieldsPersonsCustomizableOptions:
      organisation.fieldsPersonsCustomizableOptions || fixedFieldsPersonsBase.find((f) => f.name === "outOfActiveListReasons"),
  };
}

function serializeTeam(team) {
  return {
    _id: team._id,
    name: team.name,
    organisation: team.organisation,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    nightSession: team.nightSession,
  };
}

function serializeUserWithTeamsAndOrganisation(user, teams, organisation) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role,
    healthcareProfessional: user.healthcareProfessional,
    lastChangePasswordAt: user.lastChangePasswordAt,
    termsAccepted: user.termsAccepted,
    teams: teams.map(serializeTeam),
    organisation: serializeOrganisation(organisation),
  };
}

module.exports = {
  serializeOrganisation,
  serializeTeam,
  serializeUserWithTeamsAndOrganisation,
};
