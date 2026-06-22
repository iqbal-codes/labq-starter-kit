import { useOrganization } from "../../../hooks/use-organization";
import { Button } from "@admin-template/ui/components/button";
import { Input } from "@admin-template/ui/components/input";
import { Label } from "@admin-template/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@admin-template/ui/components/card";
import { useOrganizationProfile } from "./hooks/use-organization-profile";

export function SettingsOrganizationPage() {
  const { organization } = useOrganization();
  const { name, setName, updateProfile } = useOrganizationProfile(organization?.name ?? "");

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Organization Settings</h1>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your organization details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button
            onClick={() => updateProfile.mutate({ name })}
            disabled={updateProfile.isPending || !name}
          >
            {updateProfile.isPending ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
