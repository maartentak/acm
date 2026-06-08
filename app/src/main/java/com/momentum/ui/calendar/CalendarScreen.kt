package com.momentum.ui.calendar

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.EventAvailable
import androidx.compose.material.icons.rounded.SelfImprovement
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.momentum.data.calendar.FreeSlot
import com.momentum.ui.AppViewModelProvider
import com.momentum.ui.components.GradientHeader
import com.momentum.ui.components.PrimaryPillButton
import com.momentum.ui.components.SectionHeader
import com.momentum.ui.theme.Accent
import com.momentum.ui.theme.OnInkMuted
import com.momentum.ui.theme.Success
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun CalendarScreen(
    onOpenTask: (Long) -> Unit,
    contentPadding: PaddingValues,
    viewModel: CalendarViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp, end = 20.dp,
            top = contentPadding.calculateTopPadding() + 12.dp,
            bottom = contentPadding.calculateBottomPadding() + 24.dp
        ),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            GradientHeader(
                eyebrow = "Your day",
                headline = if (state.connected)
                    "${state.suggestions.size} openings to make progress."
                else
                    "Connect your calendars to find time."
            )
        }

        if (!state.connected) {
            item { ConnectCard(onConnect = viewModel::connectBoth) }
            return@LazyColumn
        }

        item {
            SectionHeader(
                title = "Opportunities in your day",
                trailing = "${state.unscheduledCount} tasks waiting"
            )
        }

        if (state.suggestions.isEmpty()) {
            item {
                InfoCard(
                    icon = Icons.Rounded.EventAvailable,
                    title = "No open slots right now",
                    body = "Your day is packed. Momentum will surface time as it frees up."
                )
            }
        }

        items(state.suggestions, key = { it.slot.start }) { suggestion ->
            SlotCard(
                slot = suggestion.slot,
                taskTitle = suggestion.task?.title,
                taskMinutes = suggestion.task?.estimatedMinutes,
                onSchedule = { suggestion.task?.let { viewModel.schedule(it, suggestion.slot) } },
                onOpen = { suggestion.task?.let { onOpenTask(it.id) } },
                modifier = Modifier.animateContentSize()
            )
        }
    }
}

@Composable
private fun ConnectCard(onConnect: () -> Unit) {
    Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(24.dp)) {
            Icon(Icons.Rounded.CalendarMonth, contentDescription = null, tint = Accent, modifier = Modifier.size(36.dp))
            Spacer(Modifier.height(16.dp))
            Text("Connect Google Calendar", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
            Spacer(Modifier.height(8.dp))
            Text(
                "Link your work and personal calendars. Momentum reads only your free/busy times to spot pockets where you can actually get things done.",
                style = MaterialTheme.typography.bodyMedium,
                color = OnInkMuted
            )
            Spacer(Modifier.height(20.dp))
            PrimaryPillButton(text = "Connect calendars", onClick = onConnect)
        }
    }
}

@Composable
private fun SlotCard(
    slot: FreeSlot,
    taskTitle: String?,
    taskMinutes: Int?,
    onSchedule: () -> Unit,
    onOpen: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(shape = RoundedCornerShape(22.dp), color = MaterialTheme.colorScheme.surfaceVariant, modifier = modifier.fillMaxWidth()) {
        Column(Modifier.padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(timeRange(slot), style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.width(8.dp))
                Text("· ${slot.durationMinutes} min free", style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
            }

            Spacer(Modifier.height(12.dp))

            if (taskTitle != null) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier.fillMaxWidth(),
                    onClick = onOpen
                ) {
                    Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("Good fit", style = MaterialTheme.typography.labelSmall, color = Accent)
                            Spacer(Modifier.height(2.dp))
                            Text(taskTitle, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Medium)
                            if (taskMinutes != null) {
                                Text("~$taskMinutes min", style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                PrimaryPillButton(text = "Schedule it here", onClick = onSchedule)
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.SelfImprovement, contentDescription = null, tint = Success)
                    Spacer(Modifier.width(10.dp))
                    Text("Open time — rest, or pick anything small.", style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
                }
            }
        }
    }
}

@Composable
private fun InfoCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, body: String) {
    Surface(shape = RoundedCornerShape(22.dp), color = MaterialTheme.colorScheme.surfaceVariant, modifier = Modifier.fillMaxWidth()) {
        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = OnInkMuted)
            Spacer(Modifier.width(14.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text(body, style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
            }
        }
    }
}

private val timeFmt = SimpleDateFormat("HH:mm", Locale.getDefault())

private fun timeRange(slot: FreeSlot): String =
    "${timeFmt.format(Date(slot.start))} – ${timeFmt.format(Date(slot.end))}"
