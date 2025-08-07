
import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') {
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

// GET /api/internal/project-assignments?teamId={teamId} - Get assignments for a team
export async function GET(req: NextRequest) {
    if (!await checkPermission(req, ['projects:view:assignments'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
        return NextResponse.json({ message: 'teamId is required' }, { status: 400 });
    }

    try {
        const q = query(collection(db, 'projectAssignments'), where('teamId', '==', teamId));
        const snapshot = await getDocs(q);
        const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(assignments);
    } catch (error) {
        console.error("Error fetching project assignments:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


// POST /api/internal/project-assignments - Assign a team to a project
export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['projects:manage:assignments'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const body = await req.json();
        const { projectId, teamId } = body;
        if (!projectId || !teamId) {
            return NextResponse.json({ message: 'projectId and teamId are required' }, { status: 400 });
        }
        
        const q = query(collection(db, 'projectAssignments'), where('projectId', '==', projectId), where('teamId', '==', teamId));
        const existing = await getDocs(q);
        if (!existing.empty) {
            return NextResponse.json({ message: 'This team is already assigned to this project.' }, { status: 409 });
        }

        const newAssignment = { projectId, teamId };
        const docRef = await addDoc(collection(db, 'projectAssignments'), newAssignment);
        return NextResponse.json({ id: docRef.id, ...newAssignment }, { status: 201 });
    } catch (error) {
        console.error("Error creating project assignment:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/internal/project-assignments - Unassign a team from a project
export async function DELETE(req: NextRequest) {
    if (!await checkPermission(req, ['projects:manage:assignments'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    try {
        const { projectId, teamId } = await req.json();
         if (!projectId || !teamId) {
            return NextResponse.json({ message: 'projectId and teamId are required' }, { status: 400 });
        }

        const q = query(collection(db, 'projectAssignments'), where('projectId', '==', projectId), where('teamId', '==', teamId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
        }

        const batch: Promise<void>[] = [];
        snapshot.forEach(docSnap => {
            batch.push(deleteDoc(doc(db, 'projectAssignments', docSnap.id)));
        });
        await Promise.all(batch);

        return NextResponse.json({ message: 'Team unassigned from project successfully' });
    } catch (error) {
        console.error("Error deleting project assignment:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
