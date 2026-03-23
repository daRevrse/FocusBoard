interface TaskDefinition {
    id: string;
    title: string;
    is_recurring?: boolean;
    status: string;
    deadline?: any; // Firestore Timestamp equivalent
    assignee_id?: string;
    [key: string]: any;
}

/**
 * Filters a list of tasks to only show the CURRENT actionable occurrence
 * of a recurring task series. Hides future occurrences.
 * Priority: 
 * 1. An "in_focus" task for that recurring series.
 * 2. If none are in focus, the "pending" task with the earliest deadline.
 */
export function filterLatestRecurringTasks<T extends TaskDefinition>(tasks: T[]): T[] {
    const recurringGroups = new Map<string, T>();
    const tasksToDisplay: T[] = [];

    for (const t of tasks) {
        if (t.is_recurring && t.status !== "completed") {
            const key = `${t.title}-${t.assignee_id}`;
            if (!recurringGroups.has(key)) {
                recurringGroups.set(key, t);
            } else {
                const existing = recurringGroups.get(key)!;
                // Priority: in_focus > pending with earlier deadline
                if (t.status === "in_focus" && existing.status !== "in_focus") {
                    recurringGroups.set(key, t);
                } else if (existing.status === "in_focus" && t.status !== "in_focus") {
                    // keep existing, it is already in_focus
                } else {
                    // Both are pending (or both in_focus, which shouldn't happen)
                    // Compare deadlines, keep the earliest one
                    const tTime = t.deadline?.seconds || Infinity;
                    const existingTime = existing.deadline?.seconds || Infinity;
                    if (tTime < existingTime) {
                        recurringGroups.set(key, t);
                    }
                }
            }
        } else {
            tasksToDisplay.push(t);
        }
    }

    // Add back the selected recurring tasks
    for (const t of recurringGroups.values()) {
        tasksToDisplay.push(t);
    }

    return tasksToDisplay;
}
