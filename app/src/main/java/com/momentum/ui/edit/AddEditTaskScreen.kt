package com.momentum.ui.edit

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.momentum.domain.model.EnergyLevel
import com.momentum.ui.AppViewModelProvider
import com.momentum.ui.components.CircleIconButton
import com.momentum.ui.components.PrimaryPillButton
import com.momentum.ui.components.SectionHeader
import com.momentum.ui.theme.Accent
import com.momentum.ui.theme.OnInkMuted
import java.util.concurrent.TimeUnit

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AddEditTaskScreen(
    onClose: () -> Unit,
    viewModel: AddEditTaskViewModel = viewModel(factory = AppViewModelProvider.Factory)
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(20.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Text(
                text = if (viewModel.isEditing) "Edit task" else "New task",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.weight(1f))
            CircleIconButton(Icons.Rounded.Close, "Close", onClose)
        }

        Spacer(Modifier.height(24.dp))

        OutlinedTextField(
            value = viewModel.title,
            onValueChange = viewModel::onTitleChange,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("What needs doing?") },
            shape = RoundedCornerShape(18.dp),
            colors = fieldColors()
        )

        Spacer(Modifier.height(12.dp))

        OutlinedTextField(
            value = viewModel.notes,
            onValueChange = viewModel::onNotesChange,
            modifier = Modifier.fillMaxWidth().height(120.dp),
            placeholder = { Text("Notes, context, links… (optional)") },
            shape = RoundedCornerShape(18.dp),
            colors = fieldColors()
        )

        Spacer(Modifier.height(24.dp))
        SectionHeader("Energy needed")
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            EnergyLevel.entries.forEach { level ->
                SelectableChip(
                    label = level.label,
                    selected = viewModel.energy == level,
                    onClick = { viewModel.onEnergyChange(level) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        Spacer(Modifier.height(24.dp))
        SectionHeader("Rough size")
        Spacer(Modifier.height(10.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val options = listOf(null to "Not sure", 5 to "5 min", 15 to "15 min", 30 to "30 min", 60 to "1 hr", 120 to "2 hr+")
            options.forEach { (minutes, label) ->
                SelectableChip(
                    label = label,
                    selected = viewModel.estimatedMinutes == minutes,
                    onClick = { viewModel.onEstimateChange(minutes) }
                )
            }
        }

        Spacer(Modifier.height(24.dp))
        SectionHeader("When")
        Spacer(Modifier.height(10.dp))
        FlowRow(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            val now = System.currentTimeMillis()
            val whenOptions = listOf(
                null to "Someday",
                now to "Today",
                now + TimeUnit.DAYS.toMillis(1) to "Tomorrow",
                now + TimeUnit.DAYS.toMillis(7) to "Next week"
            )
            whenOptions.forEach { (due, label) ->
                SelectableChip(
                    label = label,
                    selected = isSameBucket(viewModel.dueAt, due),
                    onClick = { viewModel.onDueChange(due) }
                )
            }
        }

        Spacer(Modifier.height(36.dp))
        PrimaryPillButton(
            text = if (viewModel.isEditing) "Save changes" else "Add task",
            onClick = { viewModel.save(onClose) },
            enabled = viewModel.canSave
        )
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun SelectableChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val bg = if (selected) Accent else MaterialTheme.colorScheme.surfaceVariant
    val fg = if (selected) Color.White else OnInkMuted
    Row(
        modifier = modifier
            .background(bg, RoundedCornerShape(14.dp))
            .border(
                width = if (selected) 0.dp else 1.dp,
                color = MaterialTheme.colorScheme.outline,
                shape = RoundedCornerShape(14.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.Center
    ) {
        Text(label, style = MaterialTheme.typography.labelLarge, color = fg)
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Accent,
    unfocusedBorderColor = MaterialTheme.colorScheme.outline,
    focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
    unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
    focusedTextColor = MaterialTheme.colorScheme.onSurface,
    unfocusedTextColor = MaterialTheme.colorScheme.onSurface
)

/** Treat the quick-pick buckets as equal if they fall on the same calendar day. */
private fun isSameBucket(a: Long?, b: Long?): Boolean {
    if (a == null || b == null) return a == b
    return TimeUnit.MILLISECONDS.toDays(a) == TimeUnit.MILLISECONDS.toDays(b)
}
