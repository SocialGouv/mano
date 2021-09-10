const { DataTypes, Model, Sequelize, Deferrable } = require("sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");
const sequelize = require("../db/sequelize");

class Person extends Model {}

const schema = {
  _id: { type: DataTypes.UUID, allowNull: false, defaultValue: Sequelize.UUIDV4, primaryKey: true },
  organisation: { type: DataTypes.UUID, references: { model: "Organisation", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } },

  encrypted: { type: DataTypes.TEXT },
  encryptedEntityKey: { type: DataTypes.TEXT },
};

if (!ENCRYPTED_FIELDS_ONLY) {
  // data to encrypt
  schema.user = { type: DataTypes.UUID, references: { model: "User", key: "_id", deferrable: Deferrable.INITIALLY_IMMEDIATE } };
  schema.name = { type: DataTypes.TEXT, defaultValue: "" };
  schema.otherNames = { type: DataTypes.TEXT, defaultValue: "" };
  schema.gender = { type: DataTypes.TEXT, defaultValue: "" };
  schema.birthdate = { type: DataTypes.DATE };
  schema.phone = { type: DataTypes.TEXT, defaultValue: "" };
  schema.description = { type: DataTypes.TEXT, defaultValue: "" };

  schema.alertness = { type: DataTypes.BOOLEAN }; // for people we need to take a good care of

  schema.wanderingAt = { type: DataTypes.DATE }; // temps d'errance

  schema.personalSituation = { type: DataTypes.TEXT, defaultValue: "" }; // `Homme isole / femme isolee / en couple / famille `
  schema.nationalitySituation = { type: DataTypes.TEXT, defaultValue: "" }; //`Francais / Demande d'asile , titre de sejour , UE , Sans `
  schema.hasAnimal = { type: DataTypes.TEXT, defaultValue: "" }; // Oui / Non / Non renseigné

  //creer une table hebergement
  // hebergement : `oui / non / je ne sais pas`
  // nom de l'hebergement  : ``
  // chambre : ``

  schema.structureSocial = { type: DataTypes.TEXT, defaultValue: "" }; // free field, NOT a Structure document
  schema.structureMedical = { type: DataTypes.TEXT, defaultValue: "" }; // free field, NOT a Structure document

  schema.employment = { type: DataTypes.TEXT, defaultValue: "" }; //` / DPH / CDD / CDDI / CDI / Interim / Bénévolat / Sans activité / Autre`
  schema.address = { type: DataTypes.TEXT, defaultValue: "" }; //`oui / non  / je ne sais pas`
  schema.addressDetail = { type: DataTypes.TEXT, defaultValue: "" }; //`Logement / Hébergement association / Chez un tiers / Mise à l'abri / Autre (free field) `
  schema.resources = { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] }; // `SANS / ARE / RSA / AAH / ADA / Retraite` ( mutli choix)
  schema.reasons = { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] }; // `Sortie d'hebergement / Expulsion de logement hebergement / depart du pays d'origine / depart de region / rupture familliale / perte d'emploi / sortie d'hospitalisation / pb de sante / sortie dase / Autre / ne sais pas`

  //medical
  schema.healthInsurance = { type: DataTypes.TEXT, defaultValue: "" }; //` Sans / AME / CMU / CMUC / Autre`
  schema.vulnerabilities = { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] }; //`Pathologie chronique / Psychologique / injecteur / handicap`
  schema.consumptions = { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] }; // `Crack , Opiace etc ...`
}

Person.init(schema, { sequelize, modelName: "Person", freezeTableName: true });

module.exports = Person;
