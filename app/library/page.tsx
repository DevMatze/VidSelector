import { LibraryClient } from "@/components/library-client";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("nav.library");
export default function LibraryPage() {
  return <LibraryClient />;
}
