import './globals.css';

export const metadata = {
  title: 'OpenPapers - Plataforma de Gestion de Papers Academicos',
  description: 'Sistema de gestion de Call for Papers, envio de papers y revision por pares. OpenPapers by TTPSEC SPA.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
