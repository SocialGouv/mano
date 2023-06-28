const excludeFields = new Set([
  '_id',
  'encryptedEntityKey',
  'entityKey',
  'createdBy',
  'documents',
  'user', // because it is an id
  'organisation', // because it is an id
  'action', // because it is an id
  'person', // because it is an id
  'team', // because it is an id
  'item', // because it is an id
]);
const isObject = (variable) => typeof variable === 'object' && variable !== null && !Array.isArray(variable);

const prepareItemForSearch = (item) => {
  if (typeof item === 'string') return item;
  if (!item) return '';
  const itemClean = {};
  for (let key of Object.keys(item)) {
    if (excludeFields.has(key)) continue;
    if (isObject(item[key])) {
      itemClean[key] = prepareItemForSearch(item[key]);
    } else if (Array.isArray(item[key])) {
      itemClean[key] = item[key].map(prepareItemForSearch);
    } else {
      itemClean[key] = item[key];
    }
  }
  return itemClean;
};

export const filterBySearch = (search, items = []) => {
  const searchLowercased = search.toLocaleLowerCase();
  // replace all accents with normal letters
  const searchNormalized = searchLowercased.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const searchTerms = searchLowercased.split(' ');
  const searchNormalizedTerms = searchNormalized.split(' ');

  const itemsNameStartWithWord = [];
  const itemsNameStartWithWordWithNoAccent = [];
  const itemsNameContainsOneOfTheWords = [];
  const itemsNameContainsOneOfTheWordsWithNoAccent = [];
  const anyOtherPrropertyContainsOneOfTheWords = [];
  const anyOtherPrropertyContainsOneOfTheWordsWithNoAccent = [];

  console.log('searchLowercased', searchLowercased);
  console.log('searchNormalized', searchNormalized);
  console.log('searchTerms', searchTerms);
  console.log('searchNormalizedTerms', searchNormalizedTerms);

  for (const item of items) {
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('item', item);
    const lowerCaseName = item?.name?.toLocaleLowerCase() || '';
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('lowerCaseName', lowerCaseName);
    if (lowerCaseName.startsWith(searchLowercased)) {
      if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('BOUM');
      itemsNameStartWithWord.push(item);
      continue;
    }
    const normalizedName = lowerCaseName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('normalizedName', normalizedName);
    if (normalizedName.startsWith(searchNormalized)) {
      if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('BOUM');
      itemsNameStartWithWordWithNoAccent.push(item);
      continue;
    }
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') {
      console.log(
        'searchTerms.every((word) => lowerCaseName.includes(word))',
        searchTerms.every((word) => lowerCaseName.includes(word))
      );
    }
    if (searchTerms.every((word) => lowerCaseName.includes(word))) {
      if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('BOUM');
      itemsNameContainsOneOfTheWords.push(item);
      continue;
    }
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') {
      console.log(
        'searchNormalizedTerms.every((word) => normalizedName.includes(word))',
        searchNormalizedTerms.every((word) => normalizedName.includes(word))
      );
    }
    if (searchNormalizedTerms.every((word) => normalizedName.includes(word))) {
      if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('BOUM');
      itemsNameContainsOneOfTheWordsWithNoAccent.push(item);
      continue;
    }
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') {
      console.log(
        'searchTerms.filter((word) => stringifiedItem.includes(word)).length === searchTerms.length',
        searchTerms.filter((word) => stringifiedItem.includes(word)).length === searchTerms.length
      );
    }
    const stringifiedItem = JSON.stringify(prepareItemForSearch(item)).toLocaleLowerCase();
    if (searchTerms.filter((word) => stringifiedItem.includes(word)).length === searchTerms.length) {
      if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('BOUM');
      anyOtherPrropertyContainsOneOfTheWords.push(item);
      continue;
    }
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') {
      console.log(
        'searchNormalizedTerms.filter((word) => stringifiedItemWithNoAccent.includes(word)).length === searchNormalizedTerms.length',
        searchNormalizedTerms.filter((word) => stringifiedItemWithNoAccent.includes(word)).length === searchNormalizedTerms.length
      );
    }
    const stringifiedItemWithNoAccent = stringifiedItem.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (searchNormalizedTerms.filter((word) => stringifiedItemWithNoAccent.includes(word)).length === searchNormalizedTerms.length) {
      if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('BOUM');
      anyOtherPrropertyContainsOneOfTheWordsWithNoAccent.push(item);
      continue;
    }
    if (item._id === '99b4a3f2-8d18-4ae0-88e7-9ba55cd74bda') console.log('PAS BOUM');
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
