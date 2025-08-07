
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
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

// DELETE /api/admin/teams/{teamId}/tools/{toolId} - Revoke tool access
export async function DELETE(req: NextRequest, { params }: { params: { teamId: string, toolId: string } }) {
    if (!await checkPermission(req, ['teams:manage:tools'])) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    try {
        const q = query(collection(db, 'teamToolAccess'), where('teamId', '==', params.teamId), where('toolId', '==', params.toolId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            return NextResponse.json({ message: 'Tool access record not found' }, { status: 404 });
        }

        // Delete all found documents (should be only one)
        const batch = [];
        snapshot.forEach(doc => {
            batch.push(deleteDoc(doc.ref));
        });
        await Promise.all(batch);

        return NextResponse.json({ message: 'Tool access revoked successfully' });
    } catch (error) {
        console.error("Error revoking tool access:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
