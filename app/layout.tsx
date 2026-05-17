import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CPU Scheduler Simulator",
  description: "FCFS, SJF, RR, Priority Scheduling",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}