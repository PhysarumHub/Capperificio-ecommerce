/**
 * Metadati delle collezioni (/collections/:slug).
 * File JS puro: lo leggono CollectionPage e il server (HTML delle collezioni).
 */

export const COLLECTIONS = {
  all: {
    title: 'Tutti i Prodotti',
    description: "L'intera gamma dei nostri capperi di Racale — dalle varietà classiche alle specialità artigianali.",
    label: 'Shop',
  },
  cappero: {
    title: 'Capperi',
    description: 'Capperi di Racale raccolti a mano e conservati al sale marino o in aceto artigianale.',
    label: 'Categoria',
  },
  cucunci: {
    title: 'Cucunci',
    description: 'I frutti del cappero, dalla polpa carnosa e dal sapore intenso e profumato.',
    label: 'Categoria',
  },
  foglie: {
    title: 'Foglie di Cappero',
    description: 'Foglie tenere di cappero conservate in aceto, perfette per antipasti e condimenti.',
    label: 'Categoria',
  },
  polvere: {
    title: 'Polvere di Cappero',
    description: 'Capperi di Racale essiccati e macinati: un condimento unico, intenso e versatile.',
    label: 'Specialità',
  },
};
