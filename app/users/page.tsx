import { UsersClient } from "@/components/users-client";
import { localizedTitle } from "@/lib/localized-metadata";

export const generateMetadata = () => localizedTitle("users.title");

export default function UsersPage() {
  return <UsersClient />;
}
