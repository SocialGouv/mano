"use strict";

const { QueryTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const distinctOrganisationsAffected = {};
    let organisations = await queryInterface.sequelize.query(
      'SELECT _id, name, "customFieldsMedicalFile" FROM "mano"."Organisation" WHERE "customFieldsMedicalFile" IS NOT NULL',
      { type: QueryTypes.SELECT }
    );

    for (const org of organisations) {
      if (org.customFieldsMedicalFile && org.customFieldsMedicalFile.length) {
        let hasDuplicates = false;
        let nameCounter = {};

        // First, remove all duplicates by labels and name
        const uniqueFields = [];
        const uniqueFieldLabelsAndName = {};
        for (const field of org.customFieldsMedicalFile) {
          if (field.label && field.name && !uniqueFieldLabelsAndName[field.label + field.name]) {
            uniqueFieldLabelsAndName[field.label + field.name] = true;
            uniqueFields.push(field);
          } else {
            console.log(`customFieldsMedicalFile: (!) Removed duplicate field "${field.label}" in organisation ${org._id} ${org.name}`);
          }
        }
        org.customFieldsMedicalFile = uniqueFields;

        for (const field of org.customFieldsMedicalFile) {
          if (field.name) {
            nameCounter[field.name] = (nameCounter[field.name] || 0) + 1;
            if (nameCounter[field.name] > 1) {
              hasDuplicates = true;
            }
          }
        }

        if (hasDuplicates) {
          distinctOrganisationsAffected[org._id] = org.name;
          for (const field of org.customFieldsMedicalFile) {
            if (field.name && nameCounter[field.name] > 1) {
              const previousName = field.name;
              field.name += "-" + uuidv4();
              console.log(`customFieldsMedicalFile: Renamed field to "${field.name}" (${field.label}) in organisation ${org._id} ${org.name}`);
              nameCounter[previousName] = nameCounter[previousName] - 1;
            }
          }

          await queryInterface.sequelize.query(
            'UPDATE "mano"."Organisation" SET "customFieldsMedicalFile" = :customFields, "updatedAt" = NOW() WHERE _id = :id',
            {
              replacements: {
                customFields: JSON.stringify(org.customFieldsMedicalFile),
                id: org._id,
              },
              type: QueryTypes.UPDATE,
            }
          );
        }
      }
    }

    organisations = await queryInterface.sequelize.query(
      'SELECT _id, name, "customFieldsObs" FROM "mano"."Organisation" WHERE "customFieldsObs" IS NOT NULL',
      {
        type: QueryTypes.SELECT,
      }
    );

    for (const org of organisations) {
      if (org.customFieldsObs && org.customFieldsObs.length) {
        let hasDuplicates = false;
        let nameCounter = {};

        // First, remove all duplicates by labels and name
        const uniqueFields = [];
        const uniqueFieldLabelsAndName = {};
        for (const field of org.customFieldsObs) {
          if (field.label && field.name && !uniqueFieldLabelsAndName[field.label + field.name]) {
            uniqueFieldLabelsAndName[field.label + field.name] = true;
            uniqueFields.push(field);
          } else {
            console.log(`customFieldsObs: (!) Removed duplicate field "${field.label}" in organisation ${org._id} ${org.name}`);
          }
        }
        org.customFieldsObs = uniqueFields;

        for (const field of org.customFieldsObs) {
          if (field.name) {
            nameCounter[field.name] = (nameCounter[field.name] || 0) + 1;
            if (nameCounter[field.name] > 1) {
              hasDuplicates = true;
            }
          }
        }

        if (hasDuplicates) {
          distinctOrganisationsAffected[org._id] = org.name;
          for (const field of org.customFieldsObs) {
            if (field.name && nameCounter[field.name] > 1) {
              const previousName = field.name;
              field.name += "-" + uuidv4();
              console.log(`customFieldsObs: Renamed field to "${field.name}" (${field.label}) in organisation ${org._id} ${org.name}`);
              nameCounter[previousName] = nameCounter[previousName] - 1;
            }
          }

          await queryInterface.sequelize.query(
            'UPDATE "mano"."Organisation" SET "customFieldsObs" = :customFields, "updatedAt" = NOW() WHERE _id = :id',
            {
              replacements: {
                customFields: JSON.stringify(org.customFieldsObs),
                id: org._id,
              },
              type: QueryTypes.UPDATE,
            }
          );
        }
      }
    }

    organisations = await queryInterface.sequelize.query(
      'SELECT _id, name, "customFieldsPersons" FROM "mano"."Organisation" WHERE "customFieldsPersons" IS NOT NULL',
      {
        type: QueryTypes.SELECT,
      }
    );

    for (const org of organisations) {
      if (org.customFieldsPersons && org.customFieldsPersons.length) {
        let needsUpdate = false;

        for (const personField of org.customFieldsPersons) {
          if (personField.fields && personField.fields.length) {
            let hasDuplicates = false;
            let nameCounter = {};

            // First, remove all duplicates by labels and name
            const uniqueFields = [];
            const uniqueFieldLabelsAndName = {};
            for (const field of personField.fields) {
              if (field.label && field.name && !uniqueFieldLabelsAndName[field.label + field.name]) {
                uniqueFieldLabelsAndName[field.label + field.name] = true;
                uniqueFields.push(field);
              } else {
                console.log(
                  `customFieldsPersons: (!) Removed duplicate field "${field.label}" (${personField.name}) in organisation ${org._id} ${org.name}`
                );
              }
            }
            personField.fields = uniqueFields;

            for (const field of personField.fields) {
              if (field.name) {
                nameCounter[field.name] = (nameCounter[field.name] || 0) + 1;
                if (nameCounter[field.name] > 1) {
                  hasDuplicates = true;
                }
              }
            }

            if (hasDuplicates) {
              for (const field of personField.fields) {
                if (field.name && nameCounter[field.name] > 1) {
                  const previousName = field.name;
                  field.name += "-" + uuidv4();
                  nameCounter[previousName] = nameCounter[previousName] - 1;
                  console.log(
                    `customFieldsPersons: Renamed field "${field.label}" (${personField.name}) to "${field.name}" in organisation ${org._id} ${org.name}`
                  );
                  needsUpdate = true;
                }
              }
            }
          }
        }

        if (needsUpdate) {
          distinctOrganisationsAffected[org._id] = org.name;
          await queryInterface.sequelize.query(
            'UPDATE "mano"."Organisation" SET "customFieldsPersons" = :customFields, "updatedAt" = NOW() WHERE _id = :id',
            {
              replacements: {
                customFields: JSON.stringify(org.customFieldsPersons),
                id: org._id,
              },
              type: QueryTypes.UPDATE,
            }
          );
        }
      }
    }

    organisations = await queryInterface.sequelize.query(
      'SELECT _id, name, consultations FROM "mano"."Organisation" WHERE consultations IS NOT NULL',
      {
        type: QueryTypes.SELECT,
      }
    );

    for (const org of organisations) {
      if (org.consultations && org.consultations.length) {
        let needsUpdate = false;

        for (const consultationField of org.consultations) {
          if (consultationField.fields && consultationField.fields.length) {
            let hasDuplicates = false;
            let nameCounter = {};

            // First, remove all duplicates by labels and name
            const uniqueFields = [];
            const uniqueFieldLabelsAndName = {};
            for (const field of consultationField.fields) {
              if (field.label && field.name && !uniqueFieldLabelsAndName[field.label + field.name]) {
                uniqueFieldLabelsAndName[field.label + field.name] = true;
                uniqueFields.push(field);
              } else {
                console.log(
                  `consultations: (!) Removed duplicate field "${field.label}" (${consultationField.name}) in organisation ${org._id} ${org.name}`
                );
              }
            }
            consultationField.fields = uniqueFields;

            for (const field of consultationField.fields) {
              if (field.name) {
                nameCounter[field.name] = (nameCounter[field.name] || 0) + 1;
                if (nameCounter[field.name] > 1) {
                  hasDuplicates = true;
                }
              }
            }

            if (hasDuplicates) {
              for (const field of consultationField.fields) {
                if (field.name && nameCounter[field.name] > 1) {
                  const previousName = field.name;
                  field.name += "-" + uuidv4();
                  nameCounter[previousName] = nameCounter[previousName] - 1;
                  console.log(
                    `consultations: Renamed field "${field.label}" (${consultationField.name}) to "${field.name}" in organisation ${org._id} ${org.name}`
                  );
                  needsUpdate = true;
                }
              }
            }
          }
        }

        if (needsUpdate) {
          distinctOrganisationsAffected[org._id] = org.name;
          await queryInterface.sequelize.query(
            'UPDATE "mano"."Organisation" SET consultations = :customFields, "updatedAt" = NOW() WHERE _id = :id',
            {
              replacements: {
                customFields: JSON.stringify(org.consultations),
                id: org._id,
              },
              type: QueryTypes.UPDATE,
            }
          );
        }
      }
    }
    console.log("Distinct organisations affected by duplicate field names:", Object.keys(distinctOrganisationsAffected).length);
    for (const orgId in distinctOrganisationsAffected) {
      console.log(`- ${orgId} ${distinctOrganisationsAffected[orgId]}`);
    }
  },
};
