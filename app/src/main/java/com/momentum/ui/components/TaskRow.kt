package com.momentum.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AutoAwesome
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.momentum.domain.model.Task
import com.momentum.ui.theme.Accent
import com.momentum.ui.theme.OnInkMuted
import com.momentum.ui.theme.Success
import com.momentum.ui.theme.Warning

/**
 * A circular checkbox that springs and fills with green when completed, with a
 * haptic tick — the little hit of satisfaction that makes finishing feel good.
 */
@Composable
fun CompletionCheckbox(
    checked: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    val haptics = LocalHapticFeedback.current
    val scale by animateFloatAsState(
        targetValue = if (checked) 1.08f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "checkScale"
    )
    val fill by animateColorAsState(
        targetValue = if (checked) Success else Color.Transparent,
        label = "checkFill"
    )
    val border = if (checked) Success else OnInkMuted

    Box(
        modifier = modifier
            .size(28.dp)
            .scale(scale)
            .background(fill, CircleShape)
            .border(BorderStroke(2.dp, border), CircleShape)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null
            ) {
                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                onToggle()
            },
        contentAlignment = Alignment.Center
    ) {
        AnimatedVisibility(visible = checked, enter = scaleIn(spring(dampingRatio = Spring.DampingRatioMediumBouncy)) + fadeIn()) {
            Icon(Icons.Rounded.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
fun TaskRow(
    task: Task,
    onToggleComplete: () -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CompletionCheckbox(checked = task.isDone, onToggle = onToggleComplete)
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = task.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = if (task.isDone) OnInkMuted else MaterialTheme.colorScheme.onSurface,
                    textDecoration = if (task.isDone) TextDecoration.LineThrough else null,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                MetaRow(task)
            }
            if (task.hasSubtasks) {
                Spacer(Modifier.width(12.dp))
                MiniRing(progress = task.subtaskProgress)
            }
        }
    }
}

@Composable
private fun MetaRow(task: Task) {
    val items = buildList {
        if (task.isStuck()) add(MetaChipData(Icons.Rounded.AutoAwesome, "Stuck", Warning))
        task.estimatedMinutes?.let { add(MetaChipData(Icons.Rounded.Schedule, "${it}m", OnInkMuted)) }
        add(MetaChipData(Icons.Rounded.Bolt, task.energy.label, OnInkMuted))
    }
    if (items.isEmpty()) return
    Row(
        modifier = Modifier.padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        items.forEach { MetaChip(it) }
    }
}

private data class MetaChipData(val icon: androidx.compose.ui.graphics.vector.ImageVector, val label: String, val tint: Color)

@Composable
private fun MetaChip(data: MetaChipData) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(data.icon, contentDescription = null, tint = data.tint, modifier = Modifier.size(14.dp))
        Spacer(Modifier.width(4.dp))
        Text(data.label, style = MaterialTheme.typography.labelSmall, color = data.tint)
    }
}

@Composable
private fun MiniRing(progress: Float) {
    val animated by animateFloatAsState(targetValue = progress, label = "miniRing")
    Box(contentAlignment = Alignment.Center) {
        ProgressRing(progress = animated, size = 34, stroke = 4, color = Accent)
        Text(
            "${(animated * 100).toInt()}",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
