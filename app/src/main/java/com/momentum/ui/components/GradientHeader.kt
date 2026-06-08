package com.momentum.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.momentum.ui.theme.AccentBright
import com.momentum.ui.theme.AccentDeep

/**
 * The signature hero panel: a deep-blue gradient wash with a soft glow, an
 * eyebrow label and a large motivating headline that cross-fades as it changes.
 */
@Composable
fun GradientHeader(
    eyebrow: String,
    headline: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFF13234F), AccentDeep, Color(0xFF0B1020)),
                    start = Offset(0f, 0f),
                    end = Offset(900f, 900f)
                )
            )
            .background(
                Brush.radialGradient(
                    colors = listOf(AccentBright.copy(alpha = 0.45f), Color.Transparent),
                    center = Offset(180f, 120f),
                    radius = 520f
                )
            )
            .heightIn(min = 190.dp)
            .padding(24.dp)
    ) {
        Column {
            Text(
                text = eyebrow,
                style = MaterialTheme.typography.labelLarge,
                color = Color.White.copy(alpha = 0.7f)
            )
            AnimatedContent(
                targetState = headline,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "headline"
            ) { text ->
                Text(
                    text = text,
                    style = MaterialTheme.typography.displayMedium,
                    color = Color.White,
                    modifier = Modifier.padding(top = 10.dp)
                )
            }
        }
    }
}
