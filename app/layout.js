import "./globals.css";
export const metadata = { title: "Naija Pantry", description: "Soup and swallow ingredients, delivered." };
export default function Root({ children }) {
  return (<html lang="en"><head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap" />
  </head><body>{children}</body></html>);
}
