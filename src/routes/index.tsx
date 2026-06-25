import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-radial">
        <div className="text-muted-foreground">Жүктөлүүдө...</div>
      </div>
    );
  }
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}
