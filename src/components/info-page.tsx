import type { ReactNode } from "react";

type InfoPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function InfoPage({ title, description, children }: InfoPageProps) {
  return (
    <main id="main-content" className="info-page" tabIndex={-1}>
      <header className="info-hero">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </main>
  );
}
