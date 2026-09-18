package com.akashsirra.apiwatcher

import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity() {
    private val baseUrl = "https://api-watcher.example.com"
    private lateinit var status: TextView
    private lateinit var list: LinearLayout
    private lateinit var refresh: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        status=findViewById(R.id.status)
        list=findViewById(R.id.list)
        refresh=findViewById(R.id.refresh)
        refresh.setOnClickListener { loadSources() }
        loadSources()
    }

    private fun loadSources() {
        refresh.isEnabled=false
        status.text="Checking monitored APIs..."
        thread {
            try {
                val connection=URL("$baseUrl/api/sources").openConnection() as HttpURLConnection
                connection.connectTimeout=8000
                connection.readTimeout=8000
                connection.requestMethod="GET"
                val body=connection.inputStream.bufferedReader().use { it.readText() }
                val json=JSONArray(body)
                runOnUiThread {
                    list.removeAllViews()
                    for(i in 0 until json.length()) {
                        val item=json.getJSONObject(i)
                        val card=TextView(this)
                        card.text="✓  " + item.optString("name") + "\n    " + item.optString("url")
                        card.setTextColor(Color.WHITE)
                        card.textSize=15f
                        card.setPadding(18,18,18,18)
                        card.gravity=Gravity.CENTER_VERTICAL
                        card.setBackgroundColor(Color.rgb(21,21,30))
                        val params=LinearLayout.LayoutParams(-1,-2)
                        params.setMargins(0,0,0,10)
                        list.addView(card,params)
                    }
                    status.text=json.length().toString() + " APIs monitored"
                    refresh.isEnabled=true
                }
            } catch(e:Exception) {
                runOnUiThread {
                    status.text="Backend unavailable. We'll reconnect when the service is live."
                    refresh.isEnabled=true
                }
            }
        }
    }
}
