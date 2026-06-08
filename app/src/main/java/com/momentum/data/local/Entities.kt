package com.momentum.data.local

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.Relation
import com.momentum.domain.model.EnergyLevel
import com.momentum.domain.model.Subtask
import com.momentum.domain.model.Task
import com.momentum.domain.model.TaskStatus

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
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
    val postponedCount: Int = 0
)

@Entity(
    tableName = "subtasks",
    foreignKeys = [
        ForeignKey(
            entity = TaskEntity::class,
            parentColumns = ["id"],
            childColumns = ["taskId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("taskId")]
)
data class SubtaskEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val taskId: Long,
    val title: String,
    val done: Boolean = false,
    val orderIndex: Int = 0
)

data class TaskWithSubtasks(
    @Embedded val task: TaskEntity,
    @Relation(parentColumn = "id", entityColumn = "taskId")
    val subtasks: List<SubtaskEntity>
)

/* ---- Mapping between persistence and domain models ---- */

fun SubtaskEntity.toDomain() = Subtask(
    id = id, taskId = taskId, title = title, done = done, orderIndex = orderIndex
)

fun Subtask.toEntity(parentId: Long) = SubtaskEntity(
    id = id, taskId = parentId, title = title, done = done, orderIndex = orderIndex
)

fun TaskWithSubtasks.toDomain() = Task(
    id = task.id,
    title = task.title,
    notes = task.notes,
    status = task.status,
    energy = task.energy,
    estimatedMinutes = task.estimatedMinutes,
    dueAt = task.dueAt,
    scheduledAt = task.scheduledAt,
    createdAt = task.createdAt,
    lastTouchedAt = task.lastTouchedAt,
    completedAt = task.completedAt,
    postponedCount = task.postponedCount,
    subtasks = subtasks.sortedBy { it.orderIndex }.map { it.toDomain() }
)

fun Task.toEntity() = TaskEntity(
    id = id,
    title = title,
    notes = notes,
    status = status,
    energy = energy,
    estimatedMinutes = estimatedMinutes,
    dueAt = dueAt,
    scheduledAt = scheduledAt,
    createdAt = createdAt,
    lastTouchedAt = lastTouchedAt,
    completedAt = completedAt,
    postponedCount = postponedCount
)
