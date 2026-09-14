import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { gtmPageView } from '../lib/utils/gtm';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // SPA pageview: nessun full page load ai cambi rotta, quindi GTM/GA4 non
  // vedrebbero altro che la prima pagina. Il setTimeout(0) rimanda il push
  // dopo il flush degli effetti dei componenti figli (es. useSEO che imposta
  // document.title), cosi' page_title arriva corretto.
  useEffect(() => {
    const id = setTimeout(() => {
      gtmPageView({
        location: window.location.href,
        path: pathname + search,
        title: document.title,
      });
    }, 0);
    return () => clearTimeout(id);
  }, [pathname, search]);

  return null;
}
