package com.momentum.domain.model

import java.util.concurrent.TimeUnit

/** How much mental/physical energy a task needs. Helps match tasks to how you feel. */
enum class EnergyLevel(val label: String) {
    LOW("Low energy"),
    MEDIUM("Some focus"),
    HIGH("Deep focus")
}

enum class TaskStatus {
    TODO,
    DOING,
    DONE
}

data class Subtask(
    val id: Long = 0,
    val taskId: Long = 0,
    val title: String,
    val done: Boolean = false,
    val orderIndex: Int = 0
)

/**
 * The core unit of the app. A task is "living": it tracks how often it has been
 * postponed and when it was last touched so the app can gently surface the things
 * that are quietly slipping.
 */
data class Task(
    val id: Long = 0,
    val title: String,
    val notes: String = "",
    val status: TaskStatus = TaskStatus.TODO,
    val energy: EnergyLevel = EnergyLevel.MEDIUM,
    val estimatedMinutes: Int? = null,
    val dueAt: Long? = null,
    val scheduledAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val lastTouchedAt: Long = System.currentTimeMillis(),
    val completedAt: Long? = null,
    val postponedCount: Int = 0,
    val subtasks: List<Subtask> = emptyList()
) {
    val isDone: Boolean get() = status == TaskStatus.DONE

    val hasSubtasks: Boolean get() = subtasks.isNotEmpty()

    val subtaskProgress: Float
        get() = if (subtasks.isEmpty()) 0f
        else subtasks.count { it.done }.toFloat() / subtasks.size

    /** Days since the task was last meaningfully interacted with. */
    fun daysSinceTouched(now: Long = System.currentTimeMillis()): Long =
        TimeUnit.MILLISECONDS.toDays(now - lastTouchedAt)

    /**
     * "Stuck" tasks are the ones ADHD brains tend to avoid: postponed a few times,
     * or sitting untouched for a while, and not yet broken into steps.
     */
    fun isStuck(now: Long = System.currentTimeMillis()): Boolean {
        if (isDone) return false
        val stale = daysSinceTouched(now) >= 3
        val avoided = postponedCount >= 2
        return (stale || avoided) && subtaskProgress < 1f
    }
}
