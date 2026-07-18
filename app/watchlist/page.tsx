import { WatchlistClient } from "@/components/watchlist-client";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("watchlist.title");

export default function WatchlistPage() {
  return <WatchlistClient />;
}
