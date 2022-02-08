import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // https://stackoverflow.com/questions/51517324/scrollto-method-doesnt-work-in-edge
    if (document?.querySelector('.main')?.scrollTo) {
      document.querySelector('.main').scrollTo(0, 0);
    } else if (document?.querySelector('.main').scrollTop) {
      document.querySelector('.main').scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;
