import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Pulse</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to view your dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" className="w-full" size="lg">
              Sign in with GitHub
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
