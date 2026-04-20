import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Library, Sparkles, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = user?.user_metadata?.display_name
    ? String(user.user_metadata.display_name)
        .split(/\s+/)
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "L";

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-paper transition-transform group-hover:-rotate-3">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-obsidian">
            Lumina <span className="text-walnut">Books</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-mahogany" }}
            className="rounded-md px-3 py-2 font-medium text-espresso/70 transition-colors hover:bg-secondary/60 hover:text-mahogany"
          >
            <span className="hidden sm:inline">Discover</span>
            <Sparkles className="h-4 w-4 sm:hidden" />
          </Link>
          <Link
            to="/library"
            activeProps={{ className: "bg-secondary text-mahogany" }}
            className="rounded-md px-3 py-2 font-medium text-espresso/70 transition-colors hover:bg-secondary/60 hover:text-mahogany"
          >
            <span className="hidden sm:inline">My Library</span>
            <Library className="h-4 w-4 sm:hidden" />
          </Link>

          <div className="ml-2">
            {loading ? (
              <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-border/70 transition hover:ring-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                      <AvatarFallback className="bg-walnut font-display text-sm text-ivory">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-display text-sm text-obsidian">
                      {user.user_metadata?.display_name ?? user.email?.split("@")[0]}
                    </span>
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/library" })}>
                    <Library className="mr-2 h-4 w-4" /> My Library
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                    className="text-mahogany focus:text-mahogany"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => navigate({ to: "/auth", search: { redirect: "/" } })}
                className="ml-1"
              >
                <User className="mr-1.5 h-3.5 w-3.5" /> Sign in
              </Button>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
