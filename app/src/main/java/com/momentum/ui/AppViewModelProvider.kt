package com.momentum.ui

import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.createSavedStateHandle
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.momentum.MomentumApp
import com.momentum.ui.calendar.CalendarViewModel
import com.momentum.ui.detail.TaskDetailViewModel
import com.momentum.ui.edit.AddEditTaskViewModel
import com.momentum.ui.home.HomeViewModel

/** Central place that wires ViewModels to the app's [com.momentum.AppContainer]. */
object AppViewModelProvider {

    val Factory = viewModelFactory {
        initializer {
            val c = app().container
            HomeViewModel(c.taskRepository, c.calendarRepository)
        }
        initializer {
            val c = app().container
            TaskDetailViewModel(
                savedStateHandle = createSavedStateHandle(),
                repository = c.taskRepository,
                breakdownEngine = c.breakdownEngine
            )
        }
        initializer {
            val c = app().container
            AddEditTaskViewModel(
                savedStateHandle = createSavedStateHandle(),
                repository = c.taskRepository
            )
        }
        initializer {
            val c = app().container
            CalendarViewModel(c.taskRepository, c.calendarRepository)
        }
    }
}

private fun androidx.lifecycle.viewmodel.CreationExtras.app(): MomentumApp =
    (this[APPLICATION_KEY] as MomentumApp)
