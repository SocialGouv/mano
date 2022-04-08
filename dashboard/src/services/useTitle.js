import { useEffect } from 'react';

const useTitle = (title) => {
  useEffect(() => {
    document.title = `${title} | Mano`;
  }, [title]);
};

export default useTitle;
