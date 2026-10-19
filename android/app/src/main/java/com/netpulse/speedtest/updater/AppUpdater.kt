package com.netpulse.speedtest.updater

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.content.FileProvider
import com.google.gson.Gson
import com.google.gson.JsonObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

object AppUpdater {
    data class UpdateInfo(
        val hasUpdate: Boolean,
        val latestVersion: String,
        val downloadUrl: String,
        val releaseNotes: String,
        val apkSize: Long
    )

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val gson = Gson()

    suspend fun checkForUpdate(currentVersion: String = "v2.0"): UpdateInfo = withContext(Dispatchers.IO) {
        try {
            val req = Request.Builder()
                .url("https://api.github.com/repos/Suvesh108/NetPulse/releases/latest")
                .header("Accept", "application/vnd.github.v3+json")
                .build()

            val resp = client.newCall(req).execute()
            val body = resp.body?.string()
            resp.close()

            if (resp.isSuccessful && body != null) {
                val json = gson.fromJson(body, JsonObject::class.java)
                val latestTag = json.get("tag_name")?.asString ?: "v2.0"
                val bodyText = json.get("body")?.asString ?: "Latest carrier-grade engine release"

                var apkUrl = "https://github.com/Suvesh108/NetPulse/releases/download/$latestTag/NetPulse-$latestTag.apk"
                var apkSize = 13_000_000L

                val assets = json.getAsJsonArray("assets")
                if (assets != null) {
                    for (i in 0 until assets.size()) {
                        val asset = assets.get(i).asJsonObject
                        val name = asset.get("name")?.asString ?: ""
                        if (name.endsWith(".apk")) {
                            apkUrl = asset.get("browser_download_url")?.asString ?: apkUrl
                            apkSize = asset.get("size")?.asLong ?: apkSize
                            break
                        }
                    }
                }

                val hasNewer = latestTag.compareTo(currentVersion, ignoreCase = true) > 0
                return@withContext UpdateInfo(
                    hasUpdate = hasNewer,
                    latestVersion = latestTag,
                    downloadUrl = apkUrl,
                    releaseNotes = bodyText,
                    apkSize = apkSize
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        UpdateInfo(
            hasUpdate = false,
            latestVersion = currentVersion,
            downloadUrl = "https://github.com/Suvesh108/NetPulse/releases/latest",
            releaseNotes = "System is running on the latest production firmware",
            apkSize = 13_000_000L
        )
    }

    suspend fun downloadAndInstall(
        context: Context,
        apkUrl: String,
        onProgress: (Int) -> Unit,
        onError: (String) -> Unit
    ) = withContext(Dispatchers.IO) {
        try {
            val url = URL(apkUrl)
            var connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "GET"
            connection.connectTimeout = 15000
            connection.readTimeout = 30000
            connection.connect()

            // Handle HTTP redirects
            var responseCode = connection.responseCode
            if (responseCode in 300..308) {
                val redirectUrl = connection.getHeaderField("Location")
                connection.disconnect()
                connection = URL(redirectUrl).openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 15000
                connection.readTimeout = 30000
                connection.connect()
                responseCode = connection.responseCode
            }

            if (responseCode != HttpURLConnection.HTTP_OK) {
                withContext(Dispatchers.Main) { onError("Server returned HTTP $responseCode") }
                return@withContext
            }

            val fileLength = connection.contentLength
            val cacheDir = context.externalCacheDir ?: context.cacheDir
            val outputFile = File(cacheDir, "NetPulse-Update.apk")
            if (outputFile.exists()) {
                outputFile.delete()
            }

            val input: InputStream = connection.inputStream
            val output = FileOutputStream(outputFile)
            val data = ByteArray(8192)
            var total: Long = 0
            var count: Int

            while (input.read(data).also { count = it } != -1) {
                total += count.toLong()
                if (fileLength > 0) {
                    val progress = ((total * 100) / fileLength).toInt()
                    withContext(Dispatchers.Main) { onProgress(progress) }
                }
                output.write(data, 0, count)
            }

            output.flush()
            output.close()
            input.close()
            connection.disconnect()

            withContext(Dispatchers.Main) {
                onProgress(100)
                launchInstaller(context, outputFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            withContext(Dispatchers.Main) { onError(e.message ?: "Update download failed") }
        }
    }

    private fun launchInstaller(context: Context, apkFile: File) {
        val apkUri: Uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                apkFile
            )
        } else {
            Uri.fromFile(apkFile)
        }

        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(apkUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
