import Link from 'next/link';
// app/layout.js
export const metadata = {
  title: 'Mi Aplicación',
  description: 'Aplicación con Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header>
          <nav>
            <Link href="/">Inicio</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>© 2024 Mi Aplicación</p>
        </footer>
      </body>
    </html>
  );
}
