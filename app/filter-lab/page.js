import { notFound } from "next/navigation";
import FilterLab from "./preview";

// Local development tool. Photos are read in the browser and never uploaded.
export default function Page() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <FilterLab />;
}
