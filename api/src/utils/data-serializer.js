const { defaultMedicalFileCustomFields } = require("./custom-fields/medicalFile");
const {
  customFieldsPersonsMedicalBase,
  customFieldsPersonsSocialBase,
  customFieldsPersonsSummaryBase,
  defaultFieldsPersons,
} = require("./custom-fields/person");
const deprecated = require("./custom-fields/person_deprecated");

function serializeOrganisation(organisation) {
  return {
    _id: organisation._id,
    name: organisation.name,
    createdAt: organisation.createdAt,
    updatedAt: organisation.updatedAt,
    encryptionEnabled: organisation.encryptionEnabled,
    encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
    encryptedVerificationKey: organisation.encryptedVerificationKey,
    migrations: organisation.migrations,
    migrationLastUpdateAt: organisation.migrationLastUpdateAt,

    /* for family/groups */
    groupsEnabled: organisation.groupsEnabled,

    /* actions settings */
    actionsGroupedCategories: organisation.actionsGroupedCategories,

    /* services settings */
    receptionEnabled: organisation.receptionEnabled,
    groupedServices: organisation.groupedServices,

    /* collaborations */
    collaborations: organisation.collaborations,

    /* custom fields persons */
    customFieldsPersons: organisation.customFieldsPersons || defaultFieldsPersons,
    /* custom fields consultations */
    consultations: organisation.consultations,
    /* custom fields observations */
    customFieldsObs: organisation.customFieldsObs,
    /* custom fields medical file */
    customFieldsMedicalFile: organisation.customFieldsMedicalFile || defaultMedicalFileCustomFields,

    /*

     kept for retro-compatiblity only




    */
    /* categories */
    categories: !!organisation.actionsGroupedCategories
      ? organisation.actionsGroupedCategories.reduce((flattenedCategories, group) => [...flattenedCategories, ...group.categories], [])
      : organisation.categories,
    /* services */
    services: !!organisation.groupedServices
      ? organisation.groupedServices.reduce((flattenedServices, group) => [...flattenedServices, ...group.services], [])
      : organisation.services,
    /* fixed fields persons */
    personFields: deprecated.personFields,
    /* custom fields persons */
    customFieldsPersonsSocial: (
      organisation.customFieldsPersons.find((group) => group.name === "Informations sociales")?.fields || customFieldsPersonsSocialBase
    ).filter((f) => !deprecated.personFieldsNames.includes(f.name)),
    customFieldsPersonsMedical: (
      organisation.customFieldsPersons.find((group) => group.name === "Informations médicales")?.fields || customFieldsPersonsMedicalBase
    ).filter((f) => !deprecated.personFieldsNames.includes(f.name)),

    /* custom fields persons: fields with customizavble options only */
    fieldsPersonsCustomizableOptions:
      organisation.fieldsPersonsCustomizableOptions || customFieldsPersonsSummaryBase.find((f) => f.name === "outOfActiveListReasons"),
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
