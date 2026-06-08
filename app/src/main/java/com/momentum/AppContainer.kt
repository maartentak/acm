package com.momentum

import android.content.Context
import com.momentum.data.calendar.CalendarRepository
import com.momentum.data.calendar.MockCalendarRepository
import com.momentum.data.local.MomentumDatabase
import com.momentum.data.repository.TaskRepository
import com.momentum.domain.breakdown.HeuristicBreakdownEngine
import com.momentum.domain.breakdown.TaskBreakdownEngine

/**
 * Hand-rolled dependency container — small enough that a DI framework would be
 * overkill. Swap the concrete implementations here to change behaviour app-wide
 * (e.g. plug a Google-backed [CalendarRepository] or an LLM [TaskBreakdownEngine]).
 */
class AppContainer(context: Context) {

    private val database = MomentumDatabase.get(context)

    val taskRepository: TaskRepository = TaskRepository(database.taskDao())

    val breakdownEngine: TaskBreakdownEngine = HeuristicBreakdownEngine()

    val calendarRepository: CalendarRepository = MockCalendarRepository()
}
