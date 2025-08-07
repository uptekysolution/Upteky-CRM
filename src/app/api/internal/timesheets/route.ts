
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Mock data - in a real app, this would be your 'timesheetEntries' collection in Firestore
const timesheetEntries = [
    { id: 'time-1', date: '2024-07-29', user: 'Jane Smith', userId: 'user-emp-jane', task: 'Develop new homepage design', hours: 4.5, status: 'Approved' },
    { id: 'time-2', date: '2024-07-29', user: 'John Doe', userId: 'user-tl-john', task: 'Fix login page bug', hours: 3.0, status: 'Approved' },
    { id: 'time-3', date: '2024-07-29', user: 'Peter Jones', userId: 'user-hr-peter', task: 'Setup CI/CD pipeline', hours: 6.0, status: 'Pending' },
    { id: 'time-4', date: '2024-07-28', user: 'John Doe', userId: 'user-tl-john', task: 'User research for new feature', hours: 5.5, status: 'Approved' },
    { id: 'time-5', date: '2024-07-28', user: 'Jane Smith', userId: 'user-emp-jane', task: 'Develop new homepage design', hours: 4.0, status: 'Approved' },
    { id: 'time-6', date: '2024-07-27', user: 'Admin User', userId: 'user-admin', task: 'Deploy marketing website', hours: 8.0, status: 'Pending' },
    { id: 'time-7', date: '2024-07-30', user: 'Sam Wilson', userId: 'user-bd-sam', task: 'Client Follow-up', hours: 2.0, status: 'Pending' },
    { id: 'time-8', date: '2024-07-30', user: 'Jane Smith', userId: 'user-emp-jane', task: 'Update component library', hours: 5.0, status: 'Pending' },
];

// GET /api/internal/timesheets - List timesheets based on user role
export async function GET(req: NextRequest) {
    const userId = req.headers.get('X-User-Id');
    const userRole = req.headers.get('X-User-Role');

    if (!userId || !userRole) {
        return NextResponse.json({ message: 'User ID and Role are required headers' }, { status: 400 });
    }

    try {
        if (userRole === 'Admin' || userRole === 'HR') {
            // Admins and HR can see all timesheets
            // In a real Firestore query, you'd just get all documents.
            // For this mock, we just return the full array.
            return NextResponse.json(timesheetEntries);
        }

        if (userRole === 'Team Lead') {
            // Team Leads can see timesheets for their team members
            const teamMembersQuery = query(collection(db, 'teamMembers'), where('reportsToMemberId', '==', userId));
            const leadTeamsQuery = query(collection(db, 'teamMembers'), where('userId', '==', userId), where('teamRole', 'like', '%Lead%'));

            // A real implementation would be more robust. This is a simplified example.
            // Find which teams the user is a lead of.
             const leadTeamsSnapshot = await getDocs(
                query(collection(db, 'teamMembers'), where('userId', '==', userId))
            );
            const teamIds = leadTeamsSnapshot.docs.map(doc => doc.data().teamId);

            if (teamIds.length === 0) {
                 // Not a lead of any team, just return own timesheets
                const userTimesheets = timesheetEntries.filter(entry => entry.userId === userId);
                return NextResponse.json(userTimesheets);
            }

            // Get all members of those teams.
            const teamMembersSnapshot = await getDocs(
                query(collection(db, 'teamMembers'), where('teamId', 'in', teamIds))
            );
            const teamMemberUserIds = teamMembersSnapshot.docs.map(doc => doc.data().userId);
            
            // Filter the mock data. In a real query: where('userId', 'in', teamMemberUserIds)
            const teamTimesheets = timesheetEntries.filter(entry => teamMemberUserIds.includes(entry.userId));
            return NextResponse.json(teamTimesheets);
        }

        // Default to Employee role: only see their own timesheets
        const userTimesheets = timesheetEntries.filter(entry => entry.userId === userId);
        return NextResponse.json(userTimesheets);
        

    } catch (error) {
        console.error("Error fetching timesheets:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
