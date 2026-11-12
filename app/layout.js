import "./globals.css";
import Site from "@/components/Site";
export const metadata={title:"ASSAM ASTRA | ADRE Grade III",description:"Bilingual Assam exam preparation platform"};
export default function RootLayout({children}){return <html lang="en"><body><Site>{children}</Site></body></html>}