import { Alert } from 'reactstrap';
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
      <Alert
        style={{
          position: 'fixed',
          top: '10px',
          zIndex: '100',
        }}
        color="danger">
        <b>Important !</b> Votre version du dashboard doit être mise à jour pour continuer à fonctionner.
        <br /> Sauvegardez vos modifications si vous en avez et{' '}
        <a
          className="alert-link"
          style={{ textDecoration: 'underline' }}
          href="/"
          onClick={(e) => {
            e.preventDefault();
            window.location.reload(true);
          }}>
          rafraichissez cette page
        </a>
        .
      </Alert>
    );
  }

  return (
    <Alert
      style={{
        position: 'fixed',
        top: '10px',
        zIndex: '100',
      }}
      color="warning">
      Une nouvelle version du site est disponible.{' '}
      <a
        className="alert-link"
        style={{ textDecoration: 'underline' }}
        href="/"
        onClick={(e) => {
          e.preventDefault();
          window.location.reload(true);
        }}>
        Rafraichissez cette page
      </a>{' '}
      pour l'utiliser !
    </Alert>
  );
}
