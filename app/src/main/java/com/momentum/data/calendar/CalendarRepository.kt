package com.momentum.data.calendar

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Calendar
import java.util.concurrent.TimeUnit
import kotlin.math.max

/**
 * Source of calendar data for the "spot opportunities in your day" feature.
 *
 * Replace [MockCalendarRepository] with a Google-backed implementation once OAuth
 * is configured (see README → "Connecting Google Calendar"). The rest of the app
 * only depends on this interface.
 */
interface CalendarRepository {
    val connected: Flow<Boolean>

    /** Connect the given account. The mock just flips a flag. */
    suspend fun connect(source: CalendarSource)

    suspend fun disconnect()

    /** Busy events across all connected calendars within the window. */
    suspend fun events(fromMillis: Long, toMillis: Long): List<CalendarEvent>

    /** Open gaps (within waking hours) where you could slot work. */
    suspend fun freeSlots(fromMillis: Long, toMillis: Long): List<FreeSlot>
}

/**
 * A believable stand-in that produces a typical mixed work/personal day so the
 * feature is fully demonstrable without credentials. It computes real free slots
 * from the generated events, exactly like the live version will.
 */
class MockCalendarRepository : CalendarRepository {

    private val _connected = MutableStateFlow(false)
    override val connected = _connected.asStateFlow()

    override suspend fun connect(source: CalendarSource) {
        _connected.value = true
    }

    override suspend fun disconnect() {
        _connected.value = false
    }

    override suspend fun events(fromMillis: Long, toMillis: Long): List<CalendarEvent> {
        if (!_connected.value) return emptyList()
        return sampleDay().filter { it.end > fromMillis && it.start < toMillis }
            .sortedBy { it.start }
    }

    override suspend fun freeSlots(fromMillis: Long, toMillis: Long): List<FreeSlot> {
        if (!_connected.value) return emptyList()
        val dayStart = max(fromMillis, atHour(8))
        val dayEnd = minOf(toMillis, atHour(20))
        if (dayEnd <= dayStart) return emptyList()

        val busy = events(dayStart, dayEnd)
        val slots = mutableListOf<FreeSlot>()
        var cursor = dayStart
        for (event in busy) {
            if (event.start > cursor) {
                slots += FreeSlot(cursor, event.start)
            }
            cursor = max(cursor, event.end)
        }
        if (cursor < dayEnd) slots += FreeSlot(cursor, dayEnd)

        // Only surface gaps long enough to actually do something (>= 15 min).
        return slots.filter { it.durationMinutes >= 15 }
    }

    /** A representative day spread across the two connected calendars. */
    private fun sampleDay(): List<CalendarEvent> = listOf(
        CalendarEvent("Standup", atHour(9), atHour(9, 15), CalendarSource.WORK),
        CalendarEvent("Design review", atHour(10, 30), atHour(11, 30), CalendarSource.WORK),
        CalendarEvent("Lunch", atHour(12, 30), atHour(13), CalendarSource.PERSONAL),
        CalendarEvent("1:1 with manager", atHour(14), atHour(14, 30), CalendarSource.WORK),
        CalendarEvent("School pickup", atHour(16, 30), atHour(17), CalendarSource.PERSONAL),
    )

    private fun atHour(hour: Int, minute: Int = 0): Long {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        // If that time already passed today, roll the whole sample to tomorrow.
        if (cal.timeInMillis < System.currentTimeMillis() - TimeUnit.HOURS.toMillis(12)) {
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        return cal.timeInMillis
    }
}
