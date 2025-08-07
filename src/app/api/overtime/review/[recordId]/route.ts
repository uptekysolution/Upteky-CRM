
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getSessionAndUserRole } from '@/lib/auth';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';


// PUT /api/overtime/review/{recordId}
export async function PUT(req: NextRequest, { params }: { params: { recordId: string } }) {
    const { recordId } = params;
    const userRole = await getSessionAndUserRole(req);
    const approverUserId = req.headers.get('X-User-Id');

    // 1. Permission Check
    // In a real app, a Team Lead check would be more granular (is this user in my team?).
    if (!userRole || !approverUserId || !['Admin', 'HR', 'Team Lead'].includes(userRole)) {
        return NextResponse.json({ message: 'Forbidden: You do not have permission to review overtime.' }, { status: 403 });
    }

    // 2. Validate Request Body
    const body = await req.json();
    const { status, adminComment } = body;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
        return NextResponse.json({ message: "Invalid 'status' provided. Must be 'Approved' or 'Rejected'." }, { status: 400 });
    }
    
    try {
        const recordRef = doc(db, 'attendanceRecords', recordId);
        const recordSnap = await getDoc(recordRef);

        // 3. Verify Record State
        if (!recordSnap.exists()) {
            return NextResponse.json({ message: 'Record not found.' }, { status: 404 });
        }
        const recordData = recordSnap.data();
        if (recordData.overtimeApprovalStatus !== 'Pending') {
            return NextResponse.json({ message: `This record is already in '${recordData.overtimeApprovalStatus}' state and cannot be reviewed.` }, { status: 409 });
        }
        
        // 4. Logic for Approval/Rejection
        const updateData: any = {
            overtimeApprovalStatus: status,
            overtimeApprovedByUserId: approverUserId,
            overtimeApprovedAt: Timestamp.now(),
            adminComment: adminComment || null,
        };
        
        if (status === 'Approved') {
            updateData.approvedOvertimeHours = recordData.potentialOvertimeHours;
        } else { // Rejected
            updateData.approvedOvertimeHours = 0;
        }
        
        // 5. Update Document
        await updateDoc(recordRef, updateData);
        
        const updatedRecord = { ...recordData, ...updateData };

        return NextResponse.json(updatedRecord);

    } catch (error) {
        console.error(`Error reviewing overtime for record ${recordId}:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
