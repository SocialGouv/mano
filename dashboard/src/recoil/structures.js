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
