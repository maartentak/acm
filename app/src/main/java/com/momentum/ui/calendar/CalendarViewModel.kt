package com.momentum.ui.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.momentum.data.calendar.CalendarRepository
import com.momentum.data.calendar.CalendarSource
import com.momentum.data.calendar.FreeSlot
import com.momentum.data.repository.TaskRepository
import com.momentum.domain.model.EnergyLevel
import com.momentum.domain.model.Task
import com.momentum.domain.model.TaskStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.concurrent.TimeUnit

/** A free slot paired with the task we think best fits it. */
data class SlotSuggestion(
    val slot: FreeSlot,
    val task: Task?
)

data class CalendarUiState(
    val connected: Boolean = false,
    val suggestions: List<SlotSuggestion> = emptyList(),
    val unscheduledCount: Int = 0,
    val loading: Boolean = false
)

class CalendarViewModel(
    private val tasks: TaskRepository,
    private val calendar: CalendarRepository
) : ViewModel() {

    private val slots = MutableStateFlow<List<FreeSlot>>(emptyList())
    private val loading = MutableStateFlow(false)

    val uiState: StateFlow<CalendarUiState> = combine(
        tasks.observeTasks(),
        calendar.connected,
        slots,
        loading
    ) { allTasks, connected, freeSlots, isLoading ->
        val candidates = allTasks
            .filter { it.status != TaskStatus.DONE && it.scheduledAt == null }
            .sortedWith(compareByDescending<Task> { it.isStuck() }.thenBy { it.dueAt ?: Long.MAX_VALUE })
        CalendarUiState(
            connected = connected,
            suggestions = match(freeSlots, candidates),
            unscheduledCount = candidates.size,
            loading = isLoading
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = CalendarUiState()
    )

    init {
        reload()
    }

    fun connectBoth() = viewModelScope.launch {
        calendar.connect(CalendarSource.WORK)
        calendar.connect(CalendarSource.PERSONAL)
        reload()
    }

    fun disconnect() = viewModelScope.launch {
        calendar.disconnect()
        slots.value = emptyList()
    }

    fun schedule(task: Task, slot: FreeSlot) = viewModelScope.launch {
        tasks.schedule(task, slot.start)
    }

    fun reload() = viewModelScope.launch {
        loading.value = true
        try {
            val from = System.currentTimeMillis()
            val to = from + TimeUnit.DAYS.toMillis(2)
            slots.value = calendar.freeSlots(from, to)
        } finally {
            loading.value = false
        }
    }

    /** Greedily place the best-fitting task into each slot, preferring energy match. */
    private fun match(freeSlots: List<FreeSlot>, candidates: List<Task>): List<SlotSuggestion> {
        val remaining = candidates.toMutableList()
        return freeSlots.map { slot ->
            val wanted = energyForHour(slot.start)
            val pick = remaining
                .filter { (it.estimatedMinutes ?: 15) <= slot.durationMinutes }
                .minByOrNull { task ->
                    // Lower score = better. Reward energy match, prefer filling the slot.
                    val energyPenalty = if (task.energy == wanted) 0 else 1
                    val sizeGap = slot.durationMinutes - (task.estimatedMinutes ?: 15)
                    energyPenalty * 1000 + sizeGap
                }
            if (pick != null) remaining.remove(pick)
            SlotSuggestion(slot = slot, task = pick)
        }
    }

    /** Energy people typically have through the day — used as a soft preference. */
    private fun energyForHour(millis: Long): EnergyLevel {
        val hour = Calendar.getInstance().apply { timeInMillis = millis }.get(Calendar.HOUR_OF_DAY)
        return when (hour) {
            in 8..11 -> EnergyLevel.HIGH      // fresh, deep-focus window
            in 13..15 -> EnergyLevel.LOW      // post-lunch dip — good for easy wins
            else -> EnergyLevel.MEDIUM
        }
    }
}
