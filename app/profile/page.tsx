import { ProfileClient } from "@/components/profile-client";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("nav.profile");
export default function ProfilePage() {
  return <ProfileClient />;
}
