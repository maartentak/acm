package com.momentum.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Add
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.momentum.ui.calendar.CalendarScreen
import com.momentum.ui.detail.TaskDetailScreen
import com.momentum.ui.edit.AddEditTaskScreen
import com.momentum.ui.home.HomeScreen
import com.momentum.ui.theme.Accent
import com.momentum.ui.theme.AccentBright
import com.momentum.ui.theme.OnInkMuted

object Routes {
    const val HOME = "home"
    const val CALENDAR = "calendar"
    const val DETAIL = "task/{taskId}"
    const val EDIT = "edit?taskId={taskId}"

    fun detail(taskId: Long) = "task/$taskId"
    fun edit(taskId: Long = -1L) = "edit?taskId=$taskId"
}

@Composable
fun MomentumRoot() {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val showBottomBar = currentRoute == Routes.HOME || currentRoute == Routes.CALENDAR

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            AnimatedVisibility(
                visible = showBottomBar,
                enter = slideInVertically { it } + fadeIn(),
                exit = slideOutVertically { it } + fadeOut()
            ) {
                BottomBar(
                    currentRoute = currentRoute,
                    onHome = { navController.navigateTab(Routes.HOME) },
                    onCalendar = { navController.navigateTab(Routes.CALENDAR) },
                    onAdd = { navController.navigate(Routes.edit()) }
                )
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.fillMaxSize()
        ) {
            composable(Routes.HOME) {
                HomeScreen(
                    onOpenTask = { navController.navigate(Routes.detail(it)) },
                    contentPadding = padding
                )
            }
            composable(Routes.CALENDAR) {
                CalendarScreen(
                    onOpenTask = { navController.navigate(Routes.detail(it)) },
                    contentPadding = padding
                )
            }
            composable(
                route = Routes.DETAIL,
                arguments = listOf(navArgument("taskId") { type = NavType.LongType })
            ) {
                TaskDetailScreen(
                    onBack = { navController.popBackStack() },
                    onEdit = { navController.navigate(Routes.edit(it)) }
                )
            }
            composable(
                route = Routes.EDIT,
                arguments = listOf(navArgument("taskId") {
                    type = NavType.LongType
                    defaultValue = -1L
                })
            ) {
                AddEditTaskScreen(onClose = { navController.popBackStack() })
            }
        }
    }
}

private fun androidx.navigation.NavController.navigateTab(route: String) {
    navigate(route) {
        popUpTo(Routes.HOME) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
private fun BottomBar(
    currentRoute: String?,
    onHome: () -> Unit,
    onCalendar: () -> Unit,
    onAdd: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 24.dp, vertical = 16.dp)
    ) {
        Surface(
            shape = CircleShape,
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 12.dp,
            modifier = Modifier.fillMaxWidth().height(68.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxSize().padding(horizontal = 28.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                NavTab(Icons.Rounded.Home, "Today", selected = currentRoute == Routes.HOME, onClick = onHome)

                // Center add button — the bright, inviting "start something" affordance.
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .background(Brush.horizontalGradient(listOf(Accent, AccentBright)), CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = ripple(bounded = false, radius = 30.dp),
                            onClick = onAdd
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Rounded.Add, contentDescription = "Add task", tint = Color.White, modifier = Modifier.size(28.dp))
                }

                NavTab(Icons.Rounded.CalendarMonth, "Calendar", selected = currentRoute == Routes.CALENDAR, onClick = onCalendar)
            }
        }
    }
}

@Composable
private fun NavTab(icon: ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    val tint = if (selected) Accent else OnInkMuted
    Box(
        modifier = Modifier
            .size(48.dp)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(bounded = false, radius = 28.dp),
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = label, tint = tint, modifier = Modifier.size(26.dp))
    }
}
