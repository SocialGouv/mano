export const sortByName = (p1, p2) =>
  p1?.name?.toLocaleLowerCase().localeCompare(p2.name?.toLocaleLowerCase(), 'fr', { ignorPunctuation: true, sensitivity: 'base' });
