package com.momentum.data.local

import androidx.room.TypeConverter
import com.momentum.domain.model.EnergyLevel
import com.momentum.domain.model.TaskStatus

class Converters {
    @TypeConverter
    fun statusToString(status: TaskStatus): String = status.name

    @TypeConverter
    fun stringToStatus(value: String): TaskStatus = TaskStatus.valueOf(value)

    @TypeConverter
    fun energyToString(energy: EnergyLevel): String = energy.name

    @TypeConverter
    fun stringToEnergy(value: String): EnergyLevel = EnergyLevel.valueOf(value)
}
