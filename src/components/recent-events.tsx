"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Event = {
  id: string;
  timestamp: string;
  route: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  environment: string;
};

function statusVariant(code: number) {
  if (code >= 500) return "destructive" as const;
  if (code >= 400) return "secondary" as const;
  return "default" as const;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function RecentEvents({ events }: { events: Event[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Recent Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimestamp(event.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {event.route}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(event.statusCode)}>
                      {event.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {event.latencyMs}ms
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
