import { SettingsClient } from "@/components/settings-client";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("nav.settings");
export default function SettingsPage() {
  return <SettingsClient />;
}
