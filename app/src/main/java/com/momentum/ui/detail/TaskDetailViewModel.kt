package com.momentum.ui.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.momentum.data.repository.TaskRepository
import com.momentum.domain.breakdown.TaskBreakdownEngine
import com.momentum.domain.model.Subtask
import com.momentum.domain.model.Task
import com.momentum.domain.model.TaskStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class TaskDetailUiState(
    val task: Task? = null,
    val isBreakingDown: Boolean = false,
    val loaded: Boolean = false
)

class TaskDetailViewModel(
    savedStateHandle: SavedStateHandle,
    private val repository: TaskRepository,
    private val breakdownEngine: TaskBreakdownEngine
) : ViewModel() {

    private val taskId: Long = savedStateHandle["taskId"] ?: -1L
    private val breaking = MutableStateFlow(false)

    val uiState: StateFlow<TaskDetailUiState> = combine(
        repository.observeTask(taskId),
        breaking
    ) { task, isBreaking ->
        TaskDetailUiState(task = task, isBreakingDown = isBreaking, loaded = true)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = TaskDetailUiState()
    )

    /** The headline feature: turn the current task into concrete small steps. */
    fun breakItDown() {
        val current = uiState.value.task ?: return
        if (breaking.value) return
        viewModelScope.launch {
            breaking.value = true
            try {
                val steps = breakdownEngine.breakDown(current)
                if (steps.isNotEmpty()) {
                    repository.replaceSubtasks(current.id, steps)
                }
            } finally {
                breaking.value = false
            }
        }
    }

    fun toggleSubtask(subtask: Subtask) = viewModelScope.launch {
        repository.toggleSubtask(subtask)
    }

    fun toggleComplete() {
        val task = uiState.value.task ?: return
        viewModelScope.launch {
            repository.setStatus(task, if (task.isDone) TaskStatus.TODO else TaskStatus.DONE)
        }
    }

    fun postpone() {
        val task = uiState.value.task ?: return
        viewModelScope.launch { repository.postpone(task) }
    }

    fun delete(onDeleted: () -> Unit) {
        val task = uiState.value.task ?: return
        viewModelScope.launch {
            repository.delete(task.id)
            onDeleted()
        }
    }
}
