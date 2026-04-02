"use client";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <Button type="submit" variant="ghost" size="sm" className="text-xs">
        Sign out
      </Button>
    </form>
  );
}
