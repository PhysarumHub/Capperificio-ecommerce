import { useSEO } from '../hooks/useSEO';
import styles from './TerritorioPage.module.css';

const TERRITORIO_JSON_LD = {
  '@type': 'WebPage',
  name: 'Il Nostro Territorio — Capperificio Caro',
  description: 'Il Salento, la terra del cappero. Tre generazioni, una filiera corta, un territorio che si racconta in ogni bocciolo.',
};

export default function TerritorioPage() {
  useSEO({
    title: 'Il Nostro Territorio',
    description: 'Il Salento, la terra del cappero. Tre generazioni, una filiera corta e trasparente, un territorio che si racconta in ogni bocciolo di Racale.',
    path: '/territorio',
    jsonLd: TERRITORIO_JSON_LD,
  });

  return (
    <main className={styles.page}>
    </main>
  );
}
