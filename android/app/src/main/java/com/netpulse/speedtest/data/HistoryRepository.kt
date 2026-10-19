package com.netpulse.speedtest.data

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.netpulse.speedtest.model.SpeedTestResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File

class HistoryRepository(private val context: Context) {
    private val gson = Gson()
    private val historyFile = File(context.filesDir, "netpulse_history.json")

    private val _historyFlow = MutableStateFlow<List<SpeedTestResult>>(emptyList())
    val historyFlow: StateFlow<List<SpeedTestResult>> = _historyFlow.asStateFlow()

    init {
        loadHistory()
    }

    private fun loadHistory() {
        try {
            if (historyFile.exists()) {
                val json = historyFile.readText()
                val type = object : TypeToken<List<SpeedTestResult>>() {}.type
                val list: List<SpeedTestResult> = gson.fromJson(json, type) ?: emptyList()
                _historyFlow.value = list
            }
        } catch (e: Exception) {
            e.printStackTrace()
            _historyFlow.value = emptyList()
        }
    }

    suspend fun addResult(result: SpeedTestResult) = withContext(Dispatchers.IO) {
        val updated = listOf(result) + _historyFlow.value
        _historyFlow.value = updated
        persist(updated)
    }

    suspend fun deleteResult(id: String) = withContext(Dispatchers.IO) {
        val updated = _historyFlow.value.filter { it.id != id }
        _historyFlow.value = updated
        persist(updated)
    }

    suspend fun clearAll() = withContext(Dispatchers.IO) {
        _historyFlow.value = emptyList()
        persist(emptyList())
    }

    private fun persist(list: List<SpeedTestResult>) {
        try {
            val json = gson.toJson(list)
            historyFile.writeText(json)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
