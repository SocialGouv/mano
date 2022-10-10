const excludeFields = new Set([
  '_id',
  'encryptedEntityKey',
  'entityKey',
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
  const itemClean = {};
  for (let key of Object.keys(item)) {
    if (excludeFields.has(key)) continue;
    if (isObject(itemClean[key])) {
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
  search = search.toLocaleLowerCase();
  const firstItems = items.filter((item) => item?.name?.toLocaleLowerCase().startsWith(search));
  const firstItemsIds = new Set(firstItems.map((item) => item._id));
  const secondItems = items.filter((item) => !firstItemsIds.has(item._id)).filter((item) => item?.name?.toLocaleLowerCase().includes(search));
  const secondItemsIds = new Set(firstItems.map((item) => item._id));
  const lastItems = items
    .filter((item) => !firstItemsIds.has(item._id))
    .filter((item) => !secondItemsIds.has(item._id))
    .filter((item) => {
      const stringifiedItem = JSON.stringify(prepareItemForSearch(item));
      return stringifiedItem.toLocaleLowerCase().includes(search);
    });

  return [...firstItems, ...secondItems, ...lastItems];
};
