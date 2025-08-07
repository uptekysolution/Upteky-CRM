
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, addDoc, updateDoc, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/internal/crm/tickets/{ticketId}/convert-to-task - Convert ticket to a task
export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
    const { ticketId } = params;
    // In a real app, add permission checks and get authorId from auth session
    const authorId = 'system-process-id'; // System action
    const authorName = 'Upteky Central System'; 

    try {
        const ticketRef = doc(db, 'tickets', ticketId);
        const ticketSnap = await getDoc(ticketRef);

        if (!ticketSnap.exists()) {
            return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
        }
        
        const ticketData = ticketSnap.data();

        // Prevent creating duplicate tasks
        if (ticketData.linkedTaskId) {
            return NextResponse.json({ message: 'This ticket has already been converted to a task' }, { status: 400 });
        }

        const batch = writeBatch(db);

        // 1. Create new task
        const tasksCollection = collection(db, 'tasks');
        const taskNumber = Math.floor(Date.now() / 1000);
        const newTaskRef = doc(tasksCollection); // Auto-generate ID
        
        batch.set(newTaskRef, {
            title: ticketData.title,
            description: ticketData.description,
            status: 'To Do',
            priority: 'Medium',
            progress: 0,
            assignee: ticketData.assignedToUserId || null,
            linkedTicketId: ticketId,
            createdAt: Timestamp.now(),
        });

        // 2. Update the original ticket with the new task ID
        batch.update(ticketRef, { linkedTaskId: newTaskRef.id });

        // 3. Post an internal note to the ticket
        const repliesCollection = collection(db, 'ticketReplies');
        const newReplyRef = doc(repliesCollection); // Auto-generate ID
        
        batch.set(newReplyRef, {
            ticketId,
            authorId,
            authorName,
            message: `This ticket has been converted to Task #${taskNumber}.`,
            isInternalNote: true,
            createdAt: Timestamp.now(),
        });

        // Commit all batched writes
        await batch.commit();

        return NextResponse.json({ 
            message: 'Ticket converted to task successfully',
            newTaskId: newTaskRef.id
        }, { status: 201 });

    } catch (error) {
        console.error(`Error converting ticket ${ticketId} to task:`, error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
