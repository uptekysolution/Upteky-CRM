
'use client'
import { useState, useEffect } from "react";
import { PlusCircle, ThumbsUp, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// --- MOCK DATABASE & PERMISSION LOGIC ---

// Mock user for demonstration. In a real app, this would come from an auth context.
const currentUser = { id: "user-tl-john", name: "John Doe", role: "Team Lead" }; // Can be 'Employee', 'Team Lead', 'Admin', 'HR'

interface TimesheetEntry {
    id: string;
    date: string;
    user: string;
    userId: string;
    task: string;
    hours: number;
    status: string;
}

const canApprove = (entry: TimesheetEntry) => {
    if (['Admin', 'HR'].includes(currentUser.role)) return true;
    if (currentUser.role === 'Team Lead') {
        // In a real app, we'd confirm this user is actually this entry user's lead.
        // For this mock, we just check they aren't approving their own.
        return entry.userId !== currentUser.id;
    }
    return false;
}

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'Approved': return 'default';
        case 'Pending': return 'secondary';
        case 'Rejected': return 'destructive';
        default: return 'outline';
    }
}


export default function TimesheetPage() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const isManager = ['Admin', 'HR', 'Team Lead'].includes(currentUser.role);
  
  useEffect(() => {
    const fetchTimesheets = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/internal/timesheets', {
                headers: {
                    'X-User-Id': currentUser.id,
                    'X-User-Role': currentUser.role
                }
            });
            if (!response.ok) {
                throw new Error("Failed to fetch timesheet data.");
            }
            const data = await response.json();
            setEntries(data);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load timesheet entries.'
            });
        } finally {
            setLoading(false);
        }
    };
    fetchTimesheets();
  }, [toast]);


  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Timesheet Logs</CardTitle>
                <CardDescription>Log and manage work hours against tasks. Your view is based on your role.</CardDescription>
            </div>
            <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Log Time
                </span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Task</TableHead>
              <TableHead className="text-right">Hours</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-48"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 ml-auto"/></TableCell>
                        <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto"/></TableCell>
                        <TableCell><Skeleton className="h-8 w-16 ml-auto"/></TableCell>
                    </TableRow>
                ))
            ) : entries.map(entry => (
                <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.date}</TableCell>
                    <TableCell>{entry.user}</TableCell>
                    <TableCell className="text-muted-foreground">{entry.task}</TableCell>
                    <TableCell className="text-right font-mono">{entry.hours.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant={getStatusVariant(entry.status)}>{entry.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       {entry.status === 'Pending' && canApprove(entry) ? (
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon">
                               <MoreHorizontal className="h-4 w-4" />
                               <span className="sr-only">Actions</span>
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end">
                             <DropdownMenuItem>
                               <ThumbsUp className="mr-2 h-4 w-4" />
                               <span>Approve</span>
                             </DropdownMenuItem>
                              <DropdownMenuItem>
                               <X className="mr-2 h-4 w-4" />
                               <span>Reject</span>
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       ) : (
                         <Button variant="outline" size="sm" disabled>View</Button>
                       )}
                    </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>1-{entries.length}</strong> of <strong>{entries.length}</strong> accessible entries
        </div>
      </CardFooter>
    </Card>
  )
}
