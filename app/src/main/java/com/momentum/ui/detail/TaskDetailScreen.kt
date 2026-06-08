package com.momentum.ui.detail

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ArrowBack
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.DeleteOutline
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.Snooze
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.momentum.domain.model.Subtask
import com.momentum.domain.model.Task
import com.momentum.ui.AppViewModelProvider
import com.momentum.ui.components.CircleIconButton
import com.momentum.ui.components.CompletionCheckbox
import com.momentum.ui.components.PrimaryPillButton
import com.momentum.ui.components.ProgressRing
import com.momentum.ui.theme.Accent
import com.momentum.ui.theme.AccentBright
import com.momentum.ui.theme.OnInkMuted
import com.momentum.ui.theme.Success

@Composable
fun TaskDetailScreen(
    onBack: () -> Unit,
    onEdit: (Long) -> Unit,
    viewModel: TaskDetailViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val task = state.task

    Box(Modifier.fillMaxSize()) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(20.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                CircleIconButton(Icons.Rounded.ArrowBack, "Back", onBack)
                Spacer(Modifier.weight(1f))
                if (task != null) {
                    CircleIconButton(Icons.Rounded.Edit, "Edit", { onEdit(task.id) })
                    Spacer(Modifier.width(10.dp))
                    CircleIconButton(Icons.Rounded.DeleteOutline, "Delete", { viewModel.delete(onBack) })
                }
            }

            Spacer(Modifier.height(20.dp))

            if (task == null) {
                if (state.loaded) {
                    Text("This task no longer exists.", color = OnInkMuted, style = MaterialTheme.typography.bodyLarge)
                }
                return@Column
            }

            Text(
                text = task.title,
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onSurface,
                textDecoration = if (task.isDone) TextDecoration.LineThrough else null
            )

            Spacer(Modifier.height(14.dp))
            MetaChips(task)

            if (task.notes.isNotBlank()) {
                Spacer(Modifier.height(16.dp))
                Text(task.notes, style = MaterialTheme.typography.bodyLarge, color = OnInkMuted)
            }

            Spacer(Modifier.height(24.dp))
            BreakdownSection(
                task = task,
                isBreaking = state.isBreakingDown,
                onBreakDown = viewModel::breakItDown,
                onToggleSubtask = viewModel::toggleSubtask
            )

            Spacer(Modifier.height(28.dp))
            PrimaryPillButton(
                text = if (task.isDone) "Mark as not done" else "Complete task",
                onClick = viewModel::toggleComplete
            )
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                CircleIconButton(Icons.Rounded.Snooze, "Postpone", viewModel::postpone, diameter = 44)
                Spacer(Modifier.width(8.dp))
                Text("Not today — push to tomorrow", style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun MetaChips(task: Task) {
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Chip(Icons.Rounded.Bolt, task.energy.label)
        task.estimatedMinutes?.let { Chip(Icons.Rounded.Schedule, "$it min") }
        if (task.postponedCount > 0) Chip(Icons.Rounded.Snooze, "Put off ${task.postponedCount}×")
    }
}

@Composable
private fun Chip(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String) {
    Surface(shape = RoundedCornerShape(50), color = MaterialTheme.colorScheme.surfaceVariant) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = OnInkMuted, modifier = Modifier.size(14.dp))
            Spacer(Modifier.width(6.dp))
            Text(label, style = MaterialTheme.typography.labelSmall, color = OnInkMuted)
        }
    }
}

@Composable
private fun BreakdownSection(
    task: Task,
    isBreaking: Boolean,
    onBreakDown: () -> Unit,
    onToggleSubtask: (Subtask) -> Unit
) {
    Surface(
        shape = RoundedCornerShape(24.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Rounded.AutoAwesome, contentDescription = null, tint = AccentBright)
                Spacer(Modifier.width(10.dp))
                Text("Make it doable", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onSurface)
                Spacer(Modifier.weight(1f))
                if (task.hasSubtasks) {
                    val progress by animateFloatAsState(task.subtaskProgress, label = "progress")
                    Box(contentAlignment = Alignment.Center) {
                        ProgressRing(progress = progress, size = 40, color = if (progress >= 1f) Success else Accent)
                        Text("${(progress * 100).toInt()}%", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }

            if (!task.hasSubtasks) {
                Spacer(Modifier.height(8.dp))
                Text(
                    "Stuck or staring at it? Let Momentum split this into tiny, obvious steps you can just start.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = OnInkMuted
                )
            }

            Spacer(Modifier.height(16.dp))

            task.subtasks.forEachIndexed { index, subtask ->
                SubtaskRow(subtask = subtask, index = index, onToggle = { onToggleSubtask(subtask) })
            }

            if (task.subtasks.isNotEmpty()) Spacer(Modifier.height(12.dp))

            if (isBreaking) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = AccentBright)
                    Spacer(Modifier.width(12.dp))
                    Text("Breaking it down…", style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
                }
            } else {
                PrimaryPillButton(
                    text = if (task.hasSubtasks) "Break it down again" else "Break it down for me",
                    onClick = onBreakDown,
                    leadingIcon = Icons.Rounded.AutoAwesome
                )
            }
        }
    }
}

@Composable
private fun SubtaskRow(subtask: Subtask, index: Int, onToggle: () -> Unit) {
    // Each freshly generated step slides in, gently staggered, so the list feels alive.
    val visibleState = remember { MutableTransitionState(false).apply { targetState = true } }
    AnimatedVisibility(
        visibleState = visibleState,
        enter = fadeIn(tween(durationMillis = 280, delayMillis = index * 60)) +
            slideInVertically(tween(durationMillis = 280, delayMillis = index * 60)) { it / 3 }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CompletionCheckbox(checked = subtask.done, onToggle = onToggle)
            Spacer(Modifier.width(14.dp))
            Text(
                text = subtask.title,
                style = MaterialTheme.typography.bodyLarge,
                color = if (subtask.done) OnInkMuted else MaterialTheme.colorScheme.onSurface,
                textDecoration = if (subtask.done) TextDecoration.LineThrough else null
            )
        }
    }
}
