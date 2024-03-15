const excludeFields = new Set([
  "_id",
  "encryptedEntityKey",
  "entityKey",
  "createdBy",
  "documents",
  "user", // because it is an id
  "organisation", // because it is an id
  "action", // because it is an id
  "person", // because it is an id
  "team", // because it is an id
  "item", // because it is an id
]);
const isObject = (variable) => typeof variable === "object" && variable !== null && !Array.isArray(variable);

const prepareItemForSearch = (item, userSpecificExcludeFields) => {
  if (typeof item === "string") return item;
  if (!item) return "";
  const itemClean = {};
  for (let key of Object.keys(item)) {
    if (excludeFields.has(key)) continue;
    if (userSpecificExcludeFields.has(key)) continue;
    if (isObject(item[key])) {
      itemClean[key] = prepareItemForSearch(item[key], userSpecificExcludeFields);
    } else if (Array.isArray(item[key])) {
      itemClean[key] = item[key].map((subItem) => prepareItemForSearch(subItem, userSpecificExcludeFields));
    } else {
      itemClean[key] = item[key];
    }
  }
  return itemClean;
};

export const filterBySearch = (search, items = [], userSpecificExcludeFields = []) => {
  const searchLowercased = search.toLocaleLowerCase();
  // replace all accents with normal letters
  const searchNormalized = searchLowercased.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const searchTerms = searchLowercased.split(" ");
  const searchNormalizedTerms = searchNormalized.split(" ");

  const itemsNameStartWithWord = [];
  const itemsNameStartWithWordWithNoAccent = [];
  const itemsNameContainsOneOfTheWords = [];
  const itemsNameContainsOneOfTheWordsWithNoAccent = [];
  const anyOtherPrropertyContainsOneOfTheWords = [];
  const anyOtherPrropertyContainsOneOfTheWordsWithNoAccent = [];

  for (const item of items) {
    const lowerCaseName = item?.name?.toLocaleLowerCase() || "";
    if (lowerCaseName.startsWith(searchLowercased)) {
      itemsNameStartWithWord.push(item);
      continue;
    }
    const normalizedName = lowerCaseName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalizedName.startsWith(searchNormalized)) {
      itemsNameStartWithWordWithNoAccent.push(item);
      continue;
    }

    if (searchTerms.every((word) => lowerCaseName.includes(word))) {
      itemsNameContainsOneOfTheWords.push(item);
      continue;
    }
    if (searchNormalizedTerms.every((word) => normalizedName.includes(word))) {
      itemsNameContainsOneOfTheWordsWithNoAccent.push(item);
      continue;
    }
    const stringifiedItem = JSON.stringify(prepareItemForSearch(item, new Set(userSpecificExcludeFields))).toLocaleLowerCase();
    if (searchTerms.filter((word) => stringifiedItem.includes(word)).length === searchTerms.length) {
      anyOtherPrropertyContainsOneOfTheWords.push(item);
      continue;
    }
    const stringifiedItemWithNoAccent = stringifiedItem.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (searchNormalizedTerms.filter((word) => stringifiedItemWithNoAccent.includes(word)).length === searchNormalizedTerms.length) {
      anyOtherPrropertyContainsOneOfTheWordsWithNoAccent.push(item);
      continue;
    }
  }

  return [
    ...itemsNameStartWithWord,
    ...itemsNameStartWithWordWithNoAccent,
    ...itemsNameContainsOneOfTheWords,
    ...itemsNameContainsOneOfTheWordsWithNoAccent,
    ...anyOtherPrropertyContainsOneOfTheWords,
    ...anyOtherPrropertyContainsOneOfTheWordsWithNoAccent,
  ];
};
