
'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Team {
  id: string;
  name: string;
  description: string;
  teamType: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
}

const TableSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
            <TableCell><Skeleton className="h-5 w-64" /></TableCell>
            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
    ))
)


export default function TeamsProjectsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState({ teams: true, projects: true });
    const [isSeeding, setIsSeeding] = useState({ teams: false, projects: false });

    const fetchData = async (type: 'teams' | 'projects') => {
        setLoading(prev => ({ ...prev, [type]: true }));
        try {
            const response = await fetch(`/api/admin/${type}`, {
                headers: { 'X-User-Role': 'Admin' }
            });
            if (!response.ok) throw new Error(`Failed to fetch ${type}`);
            const data = await response.json();
            if (type === 'teams') setTeams(data);
            if (type === 'projects') setProjects(data);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: `Error fetching ${type}` });
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    }

    useEffect(() => {
        fetchData('teams');
        fetchData('projects');
    }, []);

    const handleSeed = async (type: 'teams' | 'projects') => {
        setIsSeeding(prev => ({...prev, [type]: true}));
        try {
            const response = await fetch(`/api/admin/seed/${type}`, {
                method: 'POST',
                headers: { 'X-User-Role': 'Admin' }
            });
            if (!response.ok) throw new Error(`Failed to seed ${type}`);
            toast({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Seeded`, description: `Initial ${type} data has been loaded.` });
            await fetchData(type); // Refresh data after seeding
        } catch (error) {
            toast({ variant: 'destructive', title: `Error seeding ${type}` });
        } finally {
            setIsSeeding(prev => ({...prev, [type]: false}));
        }
    }

    return (
        <Tabs defaultValue="teams">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Team & Project Hub</h1>
                    <p className="text-muted-foreground">Centrally manage all teams and projects.</p>
                </div>
                <TabsList>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="teams">
                <Card>
                    <CardHeader>
                         <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Teams</CardTitle>
                                <CardDescription>Manage all teams across the organization.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSeed('teams')} disabled={isSeeding.teams}>
                                    {isSeeding.teams ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isSeeding.teams ? 'Seeding...' : 'Seed Teams'}
                                </Button>
                                <Button size="sm" onClick={() => {/* TODO: Open Create Team Modal */}}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Team
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading.teams ? <TableSkeleton /> : teams.map(team => (
                                    <TableRow key={team.id}>
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell>{team.description}</TableCell>
                                        <TableCell>{team.teamType}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/teams/${team.id}`)}>
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="projects">
                 <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Projects</CardTitle>
                                <CardDescription>Manage all company projects.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSeed('projects')} disabled={isSeeding.projects}>
                                     {isSeeding.projects ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isSeeding.projects ? 'Seeding...' : 'Seed Projects'}
                                </Button>
                                <Button size="sm" onClick={() => {/* TODO: Open Create Project Modal */}}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Project
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {loading.projects ? <TableSkeleton /> : projects.map(project => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.name}</TableCell>
                                        <TableCell>{project.description}</TableCell>
                                        <TableCell>{project.status}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => {/* TODO: Navigate to Project Details */}}>
                                                Manage
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
