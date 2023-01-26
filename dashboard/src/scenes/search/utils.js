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
  const searchNormalized = search.toLocaleLowerCase();
  const searchTerms = searchNormalized.split(' ');
  // Add lowerCaseName once to items for faster search.
  const itemsWithLowerCaseName = items.map((item) => ({ ...item, lowerCaseName: item?.name?.toLocaleLowerCase() }));
  // Items that have exact match in the beginning of the search string are first.
  const firstItems = itemsWithLowerCaseName.filter((item) => item.lowerCaseName.startsWith(searchNormalized));
  const firstItemsIds = new Set(firstItems.map((item) => item._id));
  // Items that have all words in search (the order does not matter) are second.
  const secondItems = itemsWithLowerCaseName.filter(
    (item) => !firstItemsIds.has(item._id) && searchTerms.every((e) => item.lowerCaseName.includes(e))
  );
  const secondItemsIds = new Set(secondItems.map((item) => item._id));
  const lastItems = items.filter((item) => {
    if (firstItemsIds.has(item._id) || secondItemsIds.has(item._id)) return false;
    const stringifiedItem = JSON.stringify(prepareItemForSearch(item)).toLocaleLowerCase();
    for (const term of searchTerms) if (!stringifiedItem.includes(term)) return false;
    return true;
  });

  return [...firstItems, ...secondItems, ...lastItems];
};
