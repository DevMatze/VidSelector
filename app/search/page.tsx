import { SearchClient } from "@/components/search-client";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("nav.search");
export default function SearchPage() {
  return <SearchClient />;
}
