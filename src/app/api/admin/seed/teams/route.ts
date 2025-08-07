
import { NextRequest, NextResponse } from 'next/server';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initialTeams, initialTeamMembers, teamToolAccess } from '@/app/dashboard/_data/seed-data';
import { getSessionAndUserRole } from '@/lib/auth';

async function checkPermission(req: NextRequest, requiredPermissions: string[]): Promise<boolean> {
    const userRole = await getSessionAndUserRole(req); 
    if (!userRole || userRole !== 'Admin') { // Seeding should be strictly Admin
        console.warn(`Authorization failed for role '${userRole}'. Required: Admin`);
        return false;
    }
    return true;
}

export async function POST(req: NextRequest) {
    if (!await checkPermission(req, ['system:seed'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const batch = writeBatch(db);

        // Seed Teams
        initialTeams.forEach(team => {
            const teamRef = doc(db, "teams", team.id);
            batch.set(teamRef, team);
        });

        // Seed Team Members
        initialTeamMembers.forEach(member => {
            const memberRef = doc(collection(db, "teamMembers"));
            batch.set(memberRef, member);
        });
        
        // Seed Team Tool Access
        teamToolAccess.forEach(access => {
            const accessRef = doc(collection(db, "teamToolAccess"));
            batch.set(accessRef, access);
        });

        await batch.commit();

        return NextResponse.json({ message: 'Teams data seeded successfully' }, { status: 200 });
    } catch (error) {
        console.error("Error seeding teams:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
