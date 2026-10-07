"use client"

import {
  BellIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  AnimeCard,
} from "@/components/anime/anime-card"
import {
  AnimeCardSkeleton,
} from "@/components/anime/anime-card-skeleton"
import {
  ContentSection,
} from "@/components/layout/content-section"
import {
  PageContainer,
} from "@/components/layout/page-container"
import {
  ResponsiveGrid,
} from "@/components/layout/responsive-grid"
import {
  SectionHeader,
} from "@/components/layout/section-header"
import {
  EmptyState,
} from "@/components/states/empty-state"
import {
  ErrorState,
} from "@/components/states/error-state"
import {
  LoadingState,
} from "@/components/states/loading-state"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  Badge,
} from "@/components/ui/badge"
import {
  Button,
  buttonVariants,
} from "@/components/ui/button"
import {
  Checkbox,
} from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Input,
} from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Separator,
} from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Skeleton,
} from "@/components/ui/skeleton"
import {
  Switch,
} from "@/components/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Textarea,
} from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const colors = [
  {
    name: "Background",
    token: "background",
    className: "bg-background",
  },
  {
    name: "Surface",
    token: "surface",
    className: "bg-surface",
  },
  {
    name: "Elevated",
    token: "surface-elevated",
    className: "bg-surface-elevated",
  },
  {
    name: "Surface Hover",
    token: "surface-hover",
    className: "bg-surface-hover",
  },
  {
    name: "Primary",
    token: "primary",
    className: "bg-primary",
  },
  {
    name: "Brand Accent",
    token: "brand-accent",
    className: "bg-brand-accent",
  },
  {
    name: "Success",
    token: "success",
    className: "bg-success",
  },
  {
    name: "Warning",
    token: "warning",
    className: "bg-warning",
  },
  {
    name: "Destructive",
    token: "destructive",
    className: "bg-destructive",
  },
]

export default function UiShowcasePage() {
  return (
    <main>
      <PageContainer>
        <ContentSection spacing="lg">
          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-brand-accent">
            Internal · Phase 2
          </p>

          <h1 className="mt-3 text-display">
            UI Foundation
          </h1>

          <p className="mt-4 max-w-2xl text-muted-foreground">
            Internal showcase for the Anime Platform
            design system, application primitives,
            states, and anime presentation components.
          </p>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Tokens"
            title="Color system"
            description="Semantic colors used throughout the application."
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {colors.map((color) => (
              <div
                key={color.token}
                className="overflow-hidden rounded-lg border bg-surface"
              >
                <div
                  className={`h-20 ${color.className}`}
                />

                <div className="p-3">
                  <p className="text-sm font-medium">
                    {color.name}
                  </p>

                  <p className="mt-1 text-caption text-muted-foreground">
                    {color.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Typography"
            title="Type scale"
          />

          <div className="space-y-6">
            <div>
              <p className="text-caption text-muted-foreground">
                Display · 48 / 56
              </p>

              <p className="text-display">
                Anime Platform
              </p>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">
                H1 · 36 / 44
              </p>

              <p className="text-h1 font-semibold tracking-tight">
                Discover your next story
              </p>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">
                H2 · 28 / 36
              </p>

              <p className="text-h2 font-semibold tracking-tight">
                Popular this season
              </p>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">
                H3 · 22 / 30
              </p>

              <p className="text-h3 font-semibold tracking-tight">
                Watching progress
              </p>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">
                Body · 15 / 24
              </p>

              <p className="max-w-2xl text-body">
                Your anime history becomes a personal
                journey through tracking, statistics,
                discovery, achievements, and community.
              </p>
            </div>

            <div>
              <p className="text-small">
                Small text · 13 / 20
              </p>

              <p className="text-caption">
                Caption · 12 / 18
              </p>
            </div>
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Controls"
            title="Buttons"
          />

          <div className="flex flex-wrap gap-3">
            <Button>
              Primary
            </Button>

            <Button variant="secondary">
              Secondary
            </Button>

            <Button variant="outline">
              Outline
            </Button>

            <Button variant="ghost">
              Ghost
            </Button>

            <Button variant="destructive">
              Destructive
            </Button>

            <Button variant="link">
              Link
            </Button>

            <Button disabled>
              Disabled
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="xs">
              XS
            </Button>

            <Button size="sm">
              Small
            </Button>

            <Button>
              Default
            </Button>

            <Button size="lg">
              Large
            </Button>

            <Button
              size="icon"
              aria-label="Add"
            >
              <PlusIcon />
            </Button>
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            title="Form controls"
            description="Input states used by authentication, settings, tracking, reviews, and profile forms."
          />

          <div className="grid max-w-3xl gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="demo-username"
                className="text-sm font-medium"
              >
                Username
              </label>

              <Input
                id="demo-username"
                placeholder="tegar"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="demo-invalid"
                className="text-sm font-medium"
              >
                Invalid input
              </label>

              <Input
                id="demo-invalid"
                defaultValue="invalid value"
                aria-invalid="true"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label
                htmlFor="demo-bio"
                className="text-sm font-medium"
              >
                Bio
              </label>

              <Textarea
                id="demo-bio"
                placeholder="Tell people about your anime journey..."
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Status
              </p>

              <Select defaultValue="watching">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="planning">
                    Planning
                  </SelectItem>

                  <SelectItem value="watching">
                    Watching
                  </SelectItem>

                  <SelectItem value="completed">
                    Completed
                  </SelectItem>

                  <SelectItem value="paused">
                    Paused
                  </SelectItem>

                  <SelectItem value="dropped">
                    Dropped
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col justify-end gap-4">
              <label className="flex items-center gap-3 text-sm">
                <Checkbox defaultChecked />
                Show activity publicly
              </label>

              <label className="flex items-center justify-between gap-4 text-sm">
                Receive notifications
                <Switch defaultChecked />
              </label>
            </div>
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            title="Badges & avatars"
          />

          <div className="flex flex-wrap gap-2">
            <Badge>
              Primary
            </Badge>

            <Badge variant="neutral">
              Neutral
            </Badge>

            <Badge variant="success">
              Completed
            </Badge>

            <Badge variant="warning">
              Paused
            </Badge>

            <Badge variant="destructive">
              Dropped
            </Badge>

            <Badge variant="outline">
              TV
            </Badge>
          </div>

          <div className="mt-8 flex items-end gap-5">
            <Avatar size="sm">
              <AvatarFallback>
                TG
              </AvatarFallback>
            </Avatar>

            <Avatar>
              <AvatarFallback>
                TG
              </AvatarFallback>

              <AvatarBadge />
            </Avatar>

            <Avatar size="lg">
              <AvatarFallback>
                TG
              </AvatarFallback>
            </Avatar>

            <Avatar size="xl">
              <AvatarFallback>
                TG
              </AvatarFallback>
            </Avatar>
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Navigation"
            title="Tabs"
          />

          <Tabs defaultValue="overview">
            <TabsList variant="line">
              <TabsTrigger value="overview">
                Overview
              </TabsTrigger>

              <TabsTrigger value="characters">
                Characters
              </TabsTrigger>

              <TabsTrigger value="staff">
                Staff
              </TabsTrigger>

              <TabsTrigger value="relations">
                Relations
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="overview"
              className="pt-5 text-muted-foreground"
            >
              Anime overview content.
            </TabsContent>

            <TabsContent
              value="characters"
              className="pt-5 text-muted-foreground"
            >
              Character content.
            </TabsContent>

            <TabsContent
              value="staff"
              className="pt-5 text-muted-foreground"
            >
              Staff content.
            </TabsContent>

            <TabsContent
              value="relations"
              className="pt-5 text-muted-foreground"
            >
              Relations content.
            </TabsContent>
          </Tabs>

          <Tabs
            defaultValue="general"
            className="mt-10"
          >
            <TabsList>
              <TabsTrigger value="general">
                General
              </TabsTrigger>

              <TabsTrigger value="privacy">
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="general"
              className="pt-5"
            >
              Segmented tabs are available for compact
              interface contexts.
            </TabsContent>

            <TabsContent
              value="privacy"
              className="pt-5"
            >
              Privacy settings.
            </TabsContent>
          </Tabs>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Overlays"
            title="Dialogs & menus"
          />

          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className={buttonVariants({
                      variant: "outline",
                    })}
                  />
                }
              >
                Open dialog
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    Update anime
                  </DialogTitle>

                  <DialogDescription>
                    Change your progress and status for
                    this anime.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Input
                    type="number"
                    defaultValue="12"
                    aria-label="Episode progress"
                  />

                  <Select defaultValue="watching">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="watching">
                        Watching
                      </SelectItem>

                      <SelectItem value="completed">
                        Completed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button variant="outline">
                    Cancel
                  </Button>

                  <Button>
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className={buttonVariants({
                      variant: "outline",
                    })}
                  />
                }
              >
                Open sheet
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>
                    Filters
                  </SheetTitle>

                  <SheetDescription>
                    Refine anime discovery results.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 px-5">
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="tv">
                        TV
                      </SelectItem>

                      <SelectItem value="movie">
                        Movie
                      </SelectItem>

                      <SelectItem value="ova">
                        OVA
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox />
                    Only completed anime
                  </label>
                </div>

                <SheetFooter>
                  <Button>
                    Apply filters
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={buttonVariants({
                      variant: "outline",
                    })}
                  />
                }
              >
                Account menu
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                <DropdownMenuLabel>
                  My account
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem>
                  <UserIcon />
                  Profile
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <SettingsIcon />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className={buttonVariants({
                      variant: "outline",
                      size: "icon",
                    })}
                    aria-label="Notifications"
                  />
                }
              >
                <BellIcon />
              </TooltipTrigger>

              <TooltipContent>
                Notifications
              </TooltipContent>
            </Tooltip>
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Notifications"
            title="Toast feedback"
          />

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                toast.success(
                  "Anime added to your list.",
                )
              }
            >
              Success toast
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.info(
                  "Your profile was updated.",
                )
              }
            >
              Info toast
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.warning(
                  "Episode count is unknown.",
                )
              }
            >
              Warning toast
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.error(
                  "Unable to update anime.",
                )
              }
            >
              Error toast
            </Button>
          </div>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Feedback"
            title="Application states"
          />

          <ResponsiveGrid variant="cards">
            <div className="rounded-xl border bg-surface">
              <LoadingState />
            </div>

            <div className="rounded-xl border bg-surface">
              <EmptyState
                title="Nothing here yet"
                description="Anime you add will appear here."
                action={
                  <Button size="sm">
                    Discover anime
                  </Button>
                }
              />
            </div>

            <div className="rounded-xl border bg-surface">
              <ErrorState
                onRetry={() =>
                  toast.info(
                    "Retry triggered.",
                  )
                }
              />
            </div>
          </ResponsiveGrid>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            eyebrow="Anime"
            title="Anime card"
            description="Reusable presentation primitive for discovery, seasonal anime, recommendations, favorites, and related anime."
          />

          <ResponsiveGrid>
            <div className="space-y-3">
              <AnimeCard
                anime={{
                  id: "dev-frieren",
                  slug: "frieren-beyond-journeys-end",
                  title: "Frieren: Beyond Journey's End",
                  format: "TV",
                  status: "FINISHED",
                  episodes: 28,
                  season: "FALL",
                  seasonYear: 2023,
                  coverImageUrl: null,
                }}
              />

              <Button size="sm">
                Add to list
              </Button>
            </div>

            <AnimeCard
              anime={{
                id: "dev-vinland-saga-season-2",
                slug: "vinland-saga-season-2",
                title: "Vinland Saga Season 2",
                format: "TV",
                status: "FINISHED",
                episodes: 24,
                season: "WINTER",
                seasonYear: 2023,
                coverImageUrl: null,
              }}
            />

            <AnimeCard
              anime={{
                id: "dev-mushoku-tensei",
                slug: "mushoku-tensei",
                title: "Mushoku Tensei",
                format: "TV",
                status: "FINISHED",
                episodes: 11,
                season: "WINTER",
                seasonYear: 2021,
                coverImageUrl: null,
              }}
            />

            <AnimeCard
              anime={{
                id: "dev-one-piece",
                slug: "one-piece",
                title: "One Piece",
                format: "TV",
                status: "AIRING",
                episodes: null,
                season: "FALL",
                seasonYear: 1999,
                coverImageUrl: null,
              }}
            />
          </ResponsiveGrid>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            title="Anime loading skeleton"
          />

          <ResponsiveGrid>
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <AnimeCardSkeleton
                key={index}
              />
            ))}
          </ResponsiveGrid>
        </ContentSection>

        <Separator />

        <ContentSection>
          <SectionHeader
            title="Generic skeletons"
          />

          <div className="max-w-xl rounded-xl border bg-surface p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />

              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>

            <Skeleton className="mt-6 h-24 w-full rounded-lg" />
          </div>
        </ContentSection>
      </PageContainer>
    </main>
  )
}