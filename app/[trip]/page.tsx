import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TripView from "@/components/TripView";
import { getTrip, getTripSlugs } from "@/lib/trips";

export function generateStaticParams() {
  return getTripSlugs().map((trip) => ({ trip }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trip: string }>;
}): Promise<Metadata> {
  const { trip } = await params;
  const data = getTrip(trip);
  return { title: data ? data.title : "여행" };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ trip: string }>;
}) {
  const { trip } = await params;
  const data = getTrip(trip);
  if (!data) notFound();

  return <TripView trip={data} />;
}
