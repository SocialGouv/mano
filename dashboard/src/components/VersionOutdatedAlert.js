import { useRecoilValue } from 'recoil';
import { compare } from 'compare-versions';
import { VERSION } from '../config';
import { apiVersionState, minimumDashboardVersionState } from '../recoil/version';

export default function VersionOutdatedAlert() {
  const apiVersion = useRecoilValue(apiVersionState);
  const minimumDashboardVersion = useRecoilValue(minimumDashboardVersionState);

  if (!apiVersion || (compare(apiVersion, VERSION, '<=') && (!minimumDashboardVersion || compare(minimumDashboardVersion, VERSION, '<=')))) {
    return null;
  }

  if (minimumDashboardVersion > VERSION) {
    return (
      <div className="tw-fixed tw-top-2.5 tw-z-[100] tw-mb-4 tw-rounded tw-border tw-border-red-200 tw-bg-rose-200 tw-py-3 tw-px-5 tw-text-red-900">
        <b>Important !</b> Votre version du dashboard doit être mise à jour pour continuer à fonctionner.
        <br /> Sauvegardez vos modifications si vous en avez et{' '}
        <a
          className="tw-font-bold tw-text-stone-800 tw-underline"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload(true);
          }}>
          rafraichissez cette page
        </a>
        .
      </div>
    );
  }

  return (
    <div className="tw-fixed tw-top-2.5 tw-z-[100] tw-mb-4 tw-rounded tw-border tw-border-orange-50 tw-bg-amber-100 tw-py-3 tw-px-5 tw-text-orange-900">
      Une nouvelle version du site est disponible.{' '}
      <a
        className="tw-font-bold tw-text-stone-800 tw-underline"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          window.location.reload(true);
        }}>
        Rafraichissez cette page
      </a>{' '}
      pour l'utiliser !
    </div>
  );
}
