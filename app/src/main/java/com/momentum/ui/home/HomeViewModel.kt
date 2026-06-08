package com.momentum.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.momentum.data.calendar.CalendarRepository
import com.momentum.data.repository.TaskRepository
import com.momentum.domain.model.Task
import com.momentum.domain.model.TaskStatus
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar

data class HomeUiState(
    val greeting: String = "",
    val headline: String = "",
    val activeTasks: List<Task> = emptyList(),
    val stuckTasks: List<Task> = emptyList(),
    val completedToday: Int = 0,
    val openCount: Int = 0,
    val calendarConnected: Boolean = false,
    val freeSlotCount: Int = 0,
    val loading: Boolean = true
)

class HomeViewModel(
    private val repository: TaskRepository,
    private val calendar: CalendarRepository
) : ViewModel() {

    @OptIn(ExperimentalCoroutinesApi::class)
    val uiState: StateFlow<HomeUiState> = combine(
        repository.observeTasks(),
        repository.observeCompletedToday(),
        calendar.connected
    ) { tasks, completedToday, connected ->
        val active = tasks.filter { it.status != TaskStatus.DONE }
            .sortedWith(compareBy({ it.dueAt ?: Long.MAX_VALUE }, { -it.lastTouchedAt }))
        val stuck = active.filter { it.isStuck() }
        HomeUiState(
            greeting = greeting(),
            headline = headline(completedToday, active.size, stuck.size),
            activeTasks = active,
            stuckTasks = stuck,
            completedToday = completedToday,
            openCount = active.size,
            calendarConnected = connected,
            freeSlotCount = 0,
            loading = false
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = HomeUiState()
    )

    fun quickAdd(title: String) {
        val clean = title.trim()
        if (clean.isEmpty()) return
        viewModelScope.launch {
            repository.upsert(Task(title = clean))
        }
    }

    fun complete(task: Task) = viewModelScope.launch {
        repository.setStatus(task, TaskStatus.DONE)
    }

    fun reopen(task: Task) = viewModelScope.launch {
        repository.setStatus(task, TaskStatus.TODO)
    }

    fun postpone(task: Task) = viewModelScope.launch {
        repository.postpone(task)
    }

    private fun greeting(): String {
        val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 5..11 -> "Good morning"
            in 12..17 -> "Good afternoon"
            in 18..22 -> "Good evening"
            else -> "Still up"
        }
    }

    /** A motivating, FISHBOWL-style line that reacts to what's actually going on. */
    private fun headline(completedToday: Int, open: Int, stuck: Int): String = when {
        completedToday >= 3 -> "You've finished $completedToday today — you're on a roll."
        completedToday > 0 -> "$completedToday done already. Keep the momentum going."
        stuck > 0 -> "A few things are stuck. Let's make one of them tiny."
        open == 0 -> "Your list is clear. Add the next thing when you're ready."
        else -> "One small start is all today needs."
    }
}
