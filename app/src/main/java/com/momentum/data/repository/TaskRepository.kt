package com.momentum.data.repository

import com.momentum.data.local.TaskDao
import com.momentum.data.local.toDomain
import com.momentum.data.local.toEntity
import com.momentum.domain.model.Subtask
import com.momentum.domain.model.Task
import com.momentum.domain.model.TaskStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.concurrent.TimeUnit

class TaskRepository(private val dao: TaskDao) {

    fun observeTasks(): Flow<List<Task>> =
        dao.observeAll().map { list -> list.map { it.toDomain() } }

    fun observeTask(id: Long): Flow<Task?> =
        dao.observeById(id).map { it?.toDomain() }

    fun observeCompletedToday(): Flow<Int> =
        dao.observeCompletedSince(startOfToday())

    suspend fun getTask(id: Long): Task? = dao.getById(id)?.toDomain()

    /**
     * Create or update a task. Returns the persisted id.
     *
     * Existing tasks are updated in place rather than REPLACEd — a REPLACE would
     * delete-then-insert and the ON DELETE CASCADE would silently wipe subtasks.
     */
    suspend fun upsert(task: Task): Long {
        val touched = task.copy(lastTouchedAt = System.currentTimeMillis())
        return if (task.id == 0L) {
            dao.insertTask(touched.toEntity())
        } else {
            dao.updateTask(touched.toEntity())
            task.id
        }
    }

    suspend fun delete(id: Long) = dao.deleteTask(id)

    suspend fun setStatus(task: Task, status: TaskStatus) {
        val now = System.currentTimeMillis()
        dao.updateTask(
            task.toEntity().copy(
                status = status,
                lastTouchedAt = now,
                completedAt = if (status == TaskStatus.DONE) now else null
            )
        )
    }

    /** Push a task to a later day and remember that it was avoided. */
    suspend fun postpone(task: Task) {
        val tomorrow = System.currentTimeMillis() + TimeUnit.DAYS.toMillis(1)
        dao.updateTask(
            task.toEntity().copy(
                postponedCount = task.postponedCount + 1,
                dueAt = tomorrow,
                lastTouchedAt = System.currentTimeMillis()
            )
        )
    }

    suspend fun schedule(task: Task, startMillis: Long) {
        dao.updateTask(
            task.toEntity().copy(
                scheduledAt = startMillis,
                lastTouchedAt = System.currentTimeMillis()
            )
        )
    }

    /** Replace the full set of steps for a task (used by the breakdown engine). */
    suspend fun replaceSubtasks(taskId: Long, titles: List<String>) {
        dao.deleteSubtasksFor(taskId)
        val subtasks = titles.mapIndexed { index, title ->
            Subtask(taskId = taskId, title = title, orderIndex = index).toEntity(taskId)
        }
        dao.insertSubtasks(subtasks)
        bumpTouched(taskId)
    }

    suspend fun toggleSubtask(subtask: Subtask) {
        dao.updateSubtask(subtask.copy(done = !subtask.done).toEntity(subtask.taskId))
        bumpTouched(subtask.taskId)
    }

    private suspend fun bumpTouched(taskId: Long) {
        val current = dao.getById(taskId)?.task ?: return
        dao.updateTask(current.copy(lastTouchedAt = System.currentTimeMillis()))
    }

    private fun startOfToday(): Long {
        val cal = java.util.Calendar.getInstance().apply {
            set(java.util.Calendar.HOUR_OF_DAY, 0)
            set(java.util.Calendar.MINUTE, 0)
            set(java.util.Calendar.SECOND, 0)
            set(java.util.Calendar.MILLISECOND, 0)
        }
        return cal.timeInMillis
    }
}
