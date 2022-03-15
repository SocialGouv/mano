import { Alert } from 'reactstrap';
import { useRecoilValue } from 'recoil';
import { compare } from 'compare-versions';
import { VERSION } from '../config';
import { apiVersionState } from '../recoil/apiVersion';

export default function VersionOutdatedAlert() {
  const apiVersion = useRecoilValue(apiVersionState);

  if (!apiVersion || compare(apiVersion, VERSION, '<=')) {
    return null;
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
