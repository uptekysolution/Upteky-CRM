
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// A simple permission check middleware placeholder
function hasPermission(req: NextRequest, permission: string) {
    const userRole = req.headers.get('X-User-Role');
    return userRole === 'Admin' || userRole === 'Team Lead' || userRole === "HR";
}

// GET /api/internal/crm/tickets - List all tickets with filtering
export async function GET(req: NextRequest) {
    if (!hasPermission(req, 'tickets:view')) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignee = searchParams.get('assignee');

    try {
        let q = query(collection(db, 'tickets'));
        
        if (status) {
            q = query(q, where('status', '==', status));
        }
        if (priority) {
            q = query(q, where('priority', '==', priority));
        }
        if (assignee) {
            q = query(q, where('assignedToUserId', '==', assignee));
        }

        const ticketsSnapshot = await getDocs(q);
        const ticketsList = ticketsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json(ticketsList);

    } catch (error) {
        console.error("Error fetching tickets:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
