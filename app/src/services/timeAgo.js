import TimeAgo from 'javascript-time-ago';
import fr from 'javascript-time-ago/locale/fr';

const locales = [
  {
    short: 'fr',
    long: 'fr-FR',
  },
  {
    short: 'en',
    long: 'en-UK',
  },
];

const customLabels = {
  year: {
    past: {
      one: '{0} an',
      other: '{0} ans',
    },
  },
};

TimeAgo.addLocale(fr);
TimeAgo.setDefaultLocale('fr');
TimeAgo.addLabels('fr', 'birthday', customLabels);

const timeAgo = new TimeAgo(locales.map((l) => l.long));

export default timeAgo;
