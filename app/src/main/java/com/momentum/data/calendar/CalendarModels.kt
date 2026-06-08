package com.momentum.data.calendar

/** Which Google account a calendar belongs to. */
enum class CalendarSource(val label: String) {
    WORK("Work"),
    PERSONAL("Personal")
}

data class CalendarEvent(
    val title: String,
    val start: Long,
    val end: Long,
    val source: CalendarSource
)

/** A gap in the day with nothing scheduled — a chance to get something done. */
data class FreeSlot(
    val start: Long,
    val end: Long
) {
    val durationMinutes: Int get() = ((end - start) / 60_000L).toInt()
}
