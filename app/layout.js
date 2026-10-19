import "./globals.css";
import "./welcome.css";
import "./experience.css";
import "./camera.css";
import "./email.css";
import PwaRegister from "./components/pwa-register";

export const metadata = {
  title: "El Tequileño · Photo Booth",
  description: "Un recuerdo de tu visita a El Tequileño. A memory of your visit.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "El Tequileño" },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#983542",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body><PwaRegister />{children}</body>
    </html>
  );
}
