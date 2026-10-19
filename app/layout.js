import "./globals.css";
import "./welcome.css";
import "./experience.css";
import "./camera.css";

export const metadata = {
  title: "El Tequileño · Photo Booth",
  description: "Un recuerdo de tu visita a El Tequileño. A memory of your visit.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
