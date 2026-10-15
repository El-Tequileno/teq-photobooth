import "./globals.css";
import "./welcome.css";

export const metadata = {
  title: "El Tequileño · Photo Booth",
  description: "Un recuerdo de tu visita a El Tequileño. A memory of your visit.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
