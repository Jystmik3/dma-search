export const metadata = {
  title: 'DMA Weekly Q&A Search',
  description: 'Search DMA Weekly Q&A transcripts (August 2024 - present)',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}