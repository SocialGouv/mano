import { selector } from "recoil";
import { organisationState } from "./auth";

export const structuresCategoriesSelector = selector({
  key: "structuresCategoriesSelector",
  get: ({ get }) => {
    const organisation = get(organisationState);
    return organisation.structuresGroupedCategories;
  },
});

export const flattenedStructuresCategoriesSelector = selector({
  key: "flattenedStructuresCategoriesSelector",
  get: ({ get }) => {
    const structuresGroupedCategories = get(structuresCategoriesSelector);
    return structuresGroupedCategories.reduce((allCategories, { categories }) => [...allCategories, ...categories], []);
  },
});

const defaultSort = (a, b, sortOrder) => (sortOrder === "ASC" ? (a.name || "").localeCompare(b.name) : (b.name || "").localeCompare(a.name));

export const sortStructures = (sortBy, sortOrder) => (a, b) => {
  if (sortBy === "categories") {
    if (!a.categories?.length && !b.categories?.length) return defaultSort(a, b, sortOrder);
    if (!a.categories?.length) return sortOrder === "ASC" ? 1 : -1;
    if (!b.categories?.length) return sortOrder === "ASC" ? -1 : 1;
    const acategories = a.categories.join(" ");
    const bcategories = b.categories.join(" ");
    return sortOrder === "ASC" ? acategories.localeCompare(bcategories) : bcategories.localeCompare(acategories);
  }
  if (sortBy === "createdAt") {
    if (a.createdAt > b.createdAt) return sortOrder === "ASC" ? 1 : -1;
    if (a.createdAt < b.createdAt) return sortOrder === "ASC" ? -1 : 1;
    return defaultSort(a, b, sortOrder);
  }
  if (sortBy === "adresse") {
    const fullA = (a.adresse || "") + (a.postcode || "") + (a.city || "");
    const fullB = (b.adresse || "") + (b.postcode || "") + (b.city || "");
    if (!fullA && !fullB) return defaultSort(a, b, sortOrder);
    if (!fullA) return sortOrder === "ASC" ? 1 : -1;
    if (!fullB) return sortOrder === "ASC" ? -1 : 1;
    return sortOrder === "ASC" ? fullA.localeCompare(fullB) : fullB.localeCompare(fullA);
  }
  if (sortBy === "description") {
    if (!a.description && !b.description) return defaultSort(a, b, sortOrder);
    if (!a.description) return sortOrder === "ASC" ? 1 : -1;
    if (!b.description) return sortOrder === "ASC" ? -1 : 1;
    return sortOrder === "ASC" ? a.description.localeCompare(b.description) : b.description.localeCompare(a.description);
  }
  if (sortBy === "phone") {
    if (!a.phone && !b.phone) return defaultSort(a, b, sortOrder);
    if (!a.phone) return sortOrder === "ASC" ? 1 : -1;
    if (!b.phone) return sortOrder === "ASC" ? -1 : 1;
    return sortOrder === "ASC" ? a.phone.localeCompare(b.phone) : b.phone.localeCompare(a.phone);
  }
  // default sort: name
  return defaultSort(a, b, sortOrder);
};

export const structuresFields = (structuresTypes) => [
  {
    name: "name",
    label: "Nom",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "description",
    label: "Description",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "adresse",
    label: "Adresse",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "postcode",
    label: "Code postal",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "city",
    label: "Ville",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "phone",
    label: "Téléphone",
    type: "text",
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
  {
    name: "categories",
    label: "Catégories",
    type: "multi-choice",
    options: structuresTypes,
    encrypted: true,
    importable: true,
    filterable: true,
    enabled: true,
  },
];
