import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Check, CheckCircle2, ChevronRight, Clock, Copy, MapPin, Package as PackageIcon, Search as SearchIcon, Truck } from 'lucide-react';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { PackageEvent } from './packages/show';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

interface DashboardProps {
    packages: {
        id: number;
        name: string;
        description: string;
        notificationsEnabled: boolean;
        status: string;
        trackingNumber: string;
        carrierId: number;
        origin: string;
        destination: string;
        estimatedDelivery: string;
        created_at: string;
        events: PackageEvent[];
    }[];
}

function statusMeta(statusRaw: string) {
    const s = statusRaw?.toLowerCase() || '';
    if (s.includes('deliver')) {
        return {
            key: 'delivered' as const,
            label: 'Delivered',
            className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
            icon: CheckCircle2,
        };
    }
    if (s.includes('transit') || s.includes('shipped') || s.includes('out')) {
        return {
            key: 'in-transit' as const,
            label: 'In transit',
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
            icon: Truck,
        };
    }
    return {
        key: 'pending' as const,
        label: 'Pending',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
        icon: Clock,
    };
}

export default function Dashboard({ packages }: DashboardProps) {
    // Derived counts
    const total = packages.length;
    const deliveredCount = packages.filter((p) => /deliver/i.test(p.status)).length;
    const inTransitCount = packages.filter((p) => /(transit|shipped|out)/i.test(p.status)).length;

    // Local state: search & filter
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'in-transit' | 'delivered'>('all');

    const findOrigin = (events: PackageEvent[] = []): string => {
        return [...(events || [])].reverse().find((event) => event?.location != null)?.location || '';
    };

    const findDestination = (events: PackageEvent[] = []): string => {
        return (events || []).find((event) => event?.location != null)?.location || '';
    };

    const recentSorted = useMemo(
        () => [...packages].sort((a, b) => (new Date(b.created_at).getTime() || 0) - (new Date(a.created_at).getTime() || 0)),
        [packages],
    );

    const filtered = useMemo(() => {
        return recentSorted.filter((p) => {
            const meta = statusMeta(p.status);
            const matchesFilter = filter === 'all' ? true : meta.key === filter;
            const q = query.trim().toLowerCase();
            const matchesQuery =
                q.length === 0 ||
                p.name.toLowerCase().includes(q) ||
                p.trackingNumber?.toLowerCase().includes(q) ||
                p.origin?.toLowerCase().includes(q) ||
                p.destination?.toLowerCase().includes(q);
            return matchesFilter && matchesQuery;
        });
    }, [recentSorted, query, filter]);

    // Copy state (simple visual feedback)
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const handleCopy = async (text: string, id: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1200);
        } catch {
            // ignore
        }
    };

    const formatDate = (date?: string): string => {
        if (!date) return 'N/A';
        const dt = DateTime.fromISO(date);
        return dt.isValid ? dt.toLocaleString(DateTime.DATETIME_MED) : date;
    };

    const totalLabel = total === 0 ? 'No packages yet' : `${filtered.length} of ${total} shown`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-hidden p-4 md:p-6">
                {/* Page header */}
                <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Track your packages and recent activity at a glance.</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="hidden gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-3">
                    <StatCard
                        title="Total Packages"
                        value={`${total}`}
                        icon={PackageIcon}
                        gradient="from-violet-500/10 via-background to-background"
                        href="/packages"
                    />
                    <StatCard
                        title="Packages In-transit"
                        value={`${inTransitCount}`}
                        icon={Truck}
                        gradient="from-sky-500/10 via-background to-background"
                        href="/packages?status=in-transit"
                    />
                    <StatCard
                        title="Delivered Packages"
                        value={`${deliveredCount}`}
                        icon={CheckCircle2}
                        gradient="from-emerald-500/10 via-background to-background"
                        href="/packages?status=delivered"
                    />
                </div>

                {/* Recent Packages */}
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <CardTitle className="text-lg font-semibold">Recent Packages</CardTitle>
                            <span className="text-sm text-muted-foreground">{totalLabel}</span>
                        </div>

                        {/* Toolbar: search + filters */}
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <div className="relative">
                                <SearchIcon className="pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    className="pl-8 sm:w-[260px]"
                                    placeholder="Search name, tracking, place…"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                {(['all', 'pending', 'in-transit', 'delivered'] as const).map((key) => (
                                    <Button
                                        key={key}
                                        type="button"
                                        size="sm"
                                        variant={filter === key ? 'secondary' : 'ghost'}
                                        onClick={() => setFilter(key)}
                                        className="capitalize"
                                    >
                                        {key.replace('-', ' ')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {filtered.length === 0 ? (
                            <EmptyState />
                        ) : (
                            filtered.slice(0, 10).map((pkg) => {
                                const meta = statusMeta(pkg.status);
                                const StatusIcon = meta.icon;
                                const href = `/packages/${pkg.id}`;
                                const lastEvent = pkg.events && pkg.events.length > 0 ? pkg.events[pkg.events.length - 1] : undefined;

                                return (
                                    <div
                                        key={pkg.id}
                                        role="button"
                                        onClick={() => router.visit(href)}
                                        className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-all hover:bg-accent hover:text-accent-foreground"
                                    >
                                        <div className="flex w-full min-w-0 items-start gap-3">
                                            <div className="mt-1 rounded-md bg-primary/10 p-2 text-primary">
                                                <PackageIcon className="h-5 w-5" />
                                            </div>

                                            <div className="w-full min-w-0">
                                                <div className="flex w-full items-center justify-between gap-2">
                                                    <h3 className="truncate text-base font-medium">{pkg.name}</h3>
                                                    <Badge variant="secondary" className={meta.className}>
                                                        <StatusIcon className="mr-1 h-3.5 w-3.5" />
                                                        {meta.label}
                                                    </Badge>
                                                </div>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1">
                                                        <MapPin className="h-4 w-4" />
                                                        {findOrigin(pkg.events)} → {findDestination(pkg.events)}
                                                    </span>
                                                    {lastEvent?.statusDate && (
                                                        <>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="inline-flex items-center gap-1" title={formatDate(lastEvent.statusDate)}>
                                                                <Clock className="h-4 w-4" />
                                                                Updated {formatDate(lastEvent.statusDate)}
                                                            </span>
                                                        </>
                                                    )}
                                                    {pkg.estimatedDelivery && (
                                                        <>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span title={pkg.estimatedDelivery}>ETA {pkg.estimatedDelivery}</span>
                                                        </>
                                                    )}
                                                </div>

                                                {pkg.trackingNumber && (
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="font-mono">{pkg.trackingNumber}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(pkg.trackingNumber, pkg.id);
                                                            }}
                                                            title="Copy tracking number"
                                                            aria-label="Copy tracking number"
                                                        >
                                                            {copiedId === pkg.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    gradient,
    href,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    gradient?: string;
    href?: string;
}) {
    return (
        <Card className="relative overflow-hidden transition-colors hover:bg-accent/30">
            {/* Clickable overlay for the whole card when href is provided */}
            {href && <Link href={href} className="absolute inset-0 z-10" aria-label={title} />}
            <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${gradient}`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
        </Card>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border p-10 text-center">
            <div className="mb-3 rounded-full bg-muted p-3">
                <PackageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">No packages yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your first package to start tracking shipments.</p>
            <Button asChild className="mt-4">
                <Link href="/packages/create">Add package</Link>
            </Button>
        </div>
    );
}
