package com.netpulse.speedtest.data

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.netpulse.speedtest.model.SimulationSettings
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SettingsRepository(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("netpulse_settings_prefs", Context.MODE_PRIVATE)
    private val gson = Gson()

    private val _settingsFlow = MutableStateFlow(loadSettings())
    val settingsFlow: StateFlow<SimulationSettings> = _settingsFlow.asStateFlow()

    private val _unitFlow = MutableStateFlow(prefs.getString("selected_unit", "Mbps") ?: "Mbps")
    val unitFlow: StateFlow<String> = _unitFlow.asStateFlow()

    private val _themeModeFlow = MutableStateFlow(prefs.getBoolean("dark_theme", true))
    val themeModeFlow: StateFlow<Boolean> = _themeModeFlow.asStateFlow()

    private fun loadSettings(): SimulationSettings {
        val json = prefs.getString("simulation_settings", null)
        return if (json != null) {
            try {
                gson.fromJson(json, SimulationSettings::class.java) ?: SimulationSettings()
            } catch (e: Exception) {
                SimulationSettings()
            }
        } else {
            SimulationSettings()
        }
    }

    fun updateSettings(newSettings: SimulationSettings) {
        _settingsFlow.value = newSettings
        prefs.edit().putString("simulation_settings", gson.toJson(newSettings)).apply()
    }

    fun setUnit(unit: String) {
        _unitFlow.value = unit
        prefs.edit().putString("selected_unit", unit).apply()
    }

    fun toggleTheme() {
        val next = !_themeModeFlow.value
        _themeModeFlow.value = next
        prefs.edit().putBoolean("dark_theme", next).apply()
    }
}
