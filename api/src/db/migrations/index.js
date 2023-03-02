(async () => {
  await require("./2023-01-24_can-disable-territories")();
  await require("./2021-08-18_encrypt-relPersonPlace")();
  await require("./2021-09-07_terms-acceptance")();
  await require("./2021-09-10_add-maraude-in-report")();
  await require("./2021-09-10_team-night-session")();
  await require("./2021-10-01-custom-fields-obs")();
  await require("./2021-10-22_encrypted-verification-key")();
  await require("./2021-11-16_observations-as-json")();
  await require("./2021-11-26-custom-fields-persons")();
  await require("./2022-02-14-drop-unencrypted-columns")();
  await require("./2022-02-22-encrypting")();
  await require("./2022-03-07_add_migrations_in_organisation")();
  await require("./2022-03-14_add_passage_table")();
  await require("./2022-03-16-migrating")();
  await require("./2022-03-17_user_healthcare_professional")();
  await require("./2022-03-21-debug-app-dashboard-user")();
  await require("./2022-03-29_add_consultations_columns")();
  await require("./2022-04-25_soft-delete")();
  await require("./2022-05-03_add_medical_file_tables")();
  await require("./2022-06-17-custom-fields-persons-2")();
  await require("./2022-09-19_add_rencontre_table")();
  await require("./2022-11-07_add_grouped_categories")();
  await require("./2022-11-14_add_group_table")();
  await require("./2022-11-29_add_grouped_services")();
  await require("./2022-11-29_add_reports_columns")();
  await require("./2022-12-12-debug_report")();
  await require("./2022-12-27_add-unique-constraint-on-report")();
  await require("./2022-12-30_new-table-service")();
  await require("./2023-01-16_add-index-everywhere")();
  await require("./2023-01-18-gave-feedback-2023")();
  await require("./2023-01-19_custom-fields-person")();
  await require("./2023-02-16_remove-deleted-and-not-recrypted-data")();
  await require("./2023-02-28_refacto-custom-fields-person")();
})();
