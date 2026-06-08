package com.momentum.ui.home

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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.DoneAll
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.momentum.domain.model.Task
import com.momentum.ui.AppViewModelProvider
import com.momentum.ui.components.SectionHeader
import com.momentum.ui.components.TaskRow
import com.momentum.ui.theme.Accent
import com.momentum.ui.theme.OnInkMuted
import com.momentum.ui.theme.Success
import com.momentum.ui.theme.Warning
import com.momentum.ui.components.GradientHeader

@Composable
fun HomeScreen(
    onOpenTask: (Long) -> Unit,
    contentPadding: PaddingValues,
    modifier: Modifier = Modifier,
    viewModel: HomeViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            start = 20.dp, end = 20.dp,
            top = contentPadding.calculateTopPadding() + 12.dp,
            bottom = contentPadding.calculateBottomPadding() + 24.dp
        ),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            GradientHeader(
                eyebrow = "${state.greeting} · News for you",
                headline = state.headline
            )
        }

        item {
            StatsRow(completedToday = state.completedToday, open = state.openCount)
        }

        item {
            QuickAdd(onAdd = viewModel::quickAdd)
        }

        if (state.stuckTasks.isNotEmpty()) {
            item {
                Spacer(Modifier.height(4.dp))
                SectionHeader(title = "Stuck · let's unstick one", trailing = "${state.stuckTasks.size}")
            }
            items(state.stuckTasks, key = { "stuck-${it.id}" }) { task ->
                StuckCard(
                    task = task,
                    onToggleComplete = { viewModel.complete(task) },
                    onClick = { onOpenTask(task.id) }
                )
            }
        }

        item {
            Spacer(Modifier.height(4.dp))
            SectionHeader(title = "Your tasks", trailing = "${state.openCount} open")
        }

        if (state.activeTasks.isEmpty() && !state.loading) {
            item { AllClearCard() }
        }

        items(state.activeTasks, key = { it.id }) { task ->
            TaskRow(
                task = task,
                onToggleComplete = { viewModel.complete(task) },
                onClick = { onOpenTask(task.id) },
                modifier = Modifier.animateContentSize()
            )
        }
    }
}

@Composable
private fun StatsRow(completedToday: Int, open: Int) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        StatTile(
            modifier = Modifier.weight(1f),
            value = completedToday.toString(),
            label = "Done today",
            accent = Success
        )
        StatTile(
            modifier = Modifier.weight(1f),
            value = open.toString(),
            label = "On your plate",
            accent = Accent
        )
    }
}

@Composable
private fun StatTile(value: String, label: String, accent: androidx.compose.ui.graphics.Color, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant
    ) {
        Column(Modifier.padding(16.dp)) {
            Text(value, style = MaterialTheme.typography.displayMedium, color = accent)
            Text(label, style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
        }
    }
}

@Composable
private fun QuickAdd(onAdd: (String) -> Unit) {
    var text by remember { mutableStateOf("") }
    OutlinedTextField(
        value = text,
        onValueChange = { text = it },
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text("Add a task — just brain-dump it") },
        shape = RoundedCornerShape(18.dp),
        singleLine = true,
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
        keyboardActions = KeyboardActions(onDone = {
            onAdd(text); text = ""
        }),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Accent,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
            focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    )
}

@Composable
private fun StuckCard(task: Task, onToggleComplete: () -> Unit, onClick: () -> Unit) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = Warning.copy(alpha = 0.10f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(Modifier.padding(4.dp)) {
            Row(
                modifier = Modifier.padding(start = 16.dp, top = 12.dp, end = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Rounded.AutoAwesome, contentDescription = null, tint = Warning, modifier = Modifier.width(16.dp))
                Spacer(Modifier.width(6.dp))
                Text(
                    "You've been putting this off — tap to break it down",
                    style = MaterialTheme.typography.labelSmall,
                    color = Warning
                )
            }
            TaskRow(task = task, onToggleComplete = onToggleComplete, onClick = onClick)
        }
    }
}

@Composable
private fun AllClearCard() {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Rounded.DoneAll, contentDescription = null, tint = Success)
            Spacer(Modifier.width(12.dp))
            Column {
                Text("All clear", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurface)
                Text("Nothing open right now. Add the next thing when you're ready.", style = MaterialTheme.typography.bodyMedium, color = OnInkMuted)
            }
        }
    }
}
