import "./globals.css";

export const metadata = {
  title: "Assam Astra | Learn. Practice. Succeed.",
  description:
    "Prepare for Assam government examinations with mock tests, previous-year questions and current affairs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
