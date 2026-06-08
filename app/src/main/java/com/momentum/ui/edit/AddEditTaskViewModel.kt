package com.momentum.ui.edit

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.momentum.data.repository.TaskRepository
import com.momentum.domain.model.EnergyLevel
import com.momentum.domain.model.Task
import kotlinx.coroutines.launch

class AddEditTaskViewModel(
    savedStateHandle: SavedStateHandle,
    private val repository: TaskRepository
) : ViewModel() {

    private val taskId: Long = savedStateHandle["taskId"] ?: -1L
    val isEditing: Boolean = taskId > 0

    var title by mutableStateOf("")
        private set
    var notes by mutableStateOf("")
        private set
    var energy by mutableStateOf(EnergyLevel.MEDIUM)
        private set
    var estimatedMinutes by mutableStateOf<Int?>(null)
        private set
    var dueAt by mutableStateOf<Long?>(null)
        private set

    private var loaded: Task? = null

    init {
        if (isEditing) {
            viewModelScope.launch {
                repository.getTask(taskId)?.let { task ->
                    loaded = task
                    title = task.title
                    notes = task.notes
                    energy = task.energy
                    estimatedMinutes = task.estimatedMinutes
                    dueAt = task.dueAt
                }
            }
        }
    }

    val canSave: Boolean get() = title.isNotBlank()

    fun onTitleChange(value: String) { title = value }
    fun onNotesChange(value: String) { notes = value }
    fun onEnergyChange(value: EnergyLevel) { energy = value }
    fun onEstimateChange(value: Int?) { estimatedMinutes = value }
    fun onDueChange(value: Long?) { dueAt = value }

    fun save(onSaved: () -> Unit) {
        if (!canSave) return
        viewModelScope.launch {
            val base = loaded ?: Task(title = "")
            repository.upsert(
                base.copy(
                    title = title.trim(),
                    notes = notes.trim(),
                    energy = energy,
                    estimatedMinutes = estimatedMinutes,
                    dueAt = dueAt
                )
            )
            onSaved()
        }
    }
}
