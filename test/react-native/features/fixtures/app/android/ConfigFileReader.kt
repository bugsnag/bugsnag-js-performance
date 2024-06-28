@file:JvmName("BugsnagConfig")
package com.bugsnag.fixtures.reactnative.performance

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.io.IOException
import com.bugsnag.android.Bugsnag
import com.bugsnag.android.Configuration
import com.bugsnag.android.EndpointConfiguration

const val CONFIG_FILE_TIMEOUT = 5000

class ConfigFileReader {

    fun getMazeRunnerAddress(context: Context): String {
        val configFile = File("/data/local/tmp/fixture_config.json")
        var mazeAddress: String? = null
        Log.i("Bugsnag", "Attempting to read Maze Runner address from config file ${configFile.path}")

        // Poll for the fixture config file
        val pollEnd = System.currentTimeMillis() + CONFIG_FILE_TIMEOUT
        while (System.currentTimeMillis() < pollEnd) {
            if (configFile.exists()) {
                val fileContents = configFile.readText()
                val fixtureConfig = runCatching { JSONObject(fileContents) }.getOrNull()
                mazeAddress = getStringSafely(fixtureConfig, "maze_address")
                if (!mazeAddress.isNullOrBlank()) {
                    Log.i("Bugsnag", "Maze Runner address set from config file: $mazeAddress")
                    break
                }
            }

            Thread.sleep(250)
        }
        if (mazeAddress.isNullOrBlank()) {
            Log.i("Bugsnag", "Failed to read Maze Runner address from config file, reverting to legacy address")
            mazeAddress = "bs-local.com:9339"
        }
        return mazeAddress
    }

    private fun getStringSafely(jsonObject: JSONObject?, key: String): String {
        return jsonObject?.optString(key) ?: ""
    }

}

fun Context.startBugsnag() {
    val reader = ConfigFileReader()
    val mazeRunnerAddress = reader.getMazeRunnerAddress(this)
    Bugsnag.start(this, Configuration.load(this).apply {
        endpoints = EndpointConfiguration(
            "http://$mazeRunnerAddress/notify",
            "http://$mazeRunnerAddress/sessions",
        )
        logger = object : com.bugsnag.android.Logger {
            override fun e(msg: String) {
                android.util.Log.e("Bugsnag", msg)
            }

            override fun e(msg: String, throwable: Throwable) {
                android.util.Log.e("Bugsnag", msg, throwable)
            }

            override fun w(msg: String) {
                android.util.Log.w("Bugsnag", msg)
            }

            override fun w(msg: String, throwable: Throwable) {
                android.util.Log.w("Bugsnag", msg, throwable)
            }

            override fun i(msg: String) {
                android.util.Log.i("Bugsnag", msg)
            }

            override fun i(msg: String, throwable: Throwable) {
                android.util.Log.i("Bugsnag", msg, throwable)
            }

            override fun d(msg: String) {
                android.util.Log.d("Bugsnag", msg)
            }

            override fun d(msg: String, throwable: Throwable) {
                android.util.Log.d("Bugsnag", msg, throwable)
            }
        }
    })
}
