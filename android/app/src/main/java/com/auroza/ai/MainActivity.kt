package com.auroza.ai

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Log
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.*

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var speechRecognizer: SpeechRecognizer
    private lateinit var tts: TextToSpeech
    private lateinit var responseText: TextView
    private lateinit var micButton: ImageButton
    private lateinit var statusText: TextView

    private val RECORD_REQUEST_CODE = 101
    private val BACKEND_URL = "https://YOUR-BACKEND-URL/api/auroza/chat"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        responseText = findViewById(R.id.responseText)
        micButton = findViewById(R.id.micButton)
        statusText = findViewById(R.id.statusText)

        // Initialize Text To Speech Engine
        tts = TextToSpeech(this, this)

        // Check and ask for microphone permissions
        checkPermissions()

        // Setup speech recognition listeners
        setupSpeechRecognizer()

        micButton.setOnClickListener {
            startVoiceListening()
        }
    }

    private fun checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.CALL_PHONE, Manifest.permission.SEND_SMS),
                RECORD_REQUEST_CODE
            )
        }
    }

    private fun setupSpeechRecognizer() {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
        speechRecognizer.setRecognitionListener(object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                statusText.text = "Auroza listening... speak now"
            }

            override fun onBeginningOfSpeech() {}
            override fun onRmsChanged(rmsdB: Float) {}
            override fun onBufferReceived(buffer: ByteArray?) {}
            override fun onEndOfSpeech() {
                statusText.text = "Processing voice..."
            }

            override fun onError(error: Int) {
                statusText.text = "Error recognizing speech. Tap mic to retry."
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                if (!matches.isNullOrEmpty()) {
                    val userCommand = matches[0]
                    responseText.text = "You said: \"$userCommand\""
                    sendQueryToAurozaBackend(userCommand)
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {}
            override fun onEvent(eventType: Int, params: Bundle?) {}
        })
    }

    private fun startVoiceListening() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
        }
        speechRecognizer.startListening(intent)
    }

    private fun sendQueryToAurozaBackend(query: String) {
        val client = OkHttpClient()

        // Build Payload matching FastAPI backend schemas
        val jsonPayload = JSONObject().apply {
            put("message", query)
            put("history", org.json.JSONArray())
            put("permissions", JSONObject().apply {
                put("microphone", true)
                put("camera", true)
            })
            put("assistantName", "Auroza AI")
            put("language", "English")
            put("voice", "Zephyr")
        }

        val requestBody = jsonPayload.toString().toRequestBody("application/json".toMediaTypeOrNull())
        val request = Request.Builder()
            .url(BACKEND_URL)
            .post(requestBody)
            .addHeader("X-Auroza-Token", "SECURE_DEVICE_TOKEN_JWT")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    statusText.text = "Backend offline."
                    speakOut("Could not reach Auroza servers. Please check your internet connection.")
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { responseBody ->
                    try {
                        val json = JSONObject(responseBody)
                        val message = json.optString("message", "I heard you perfectly.")
                        val actions = json.optJSONArray("actions")

                        runOnUiThread {
                            responseText.text = message
                            speakOut(message)

                            // Orchestrate Accessibility service actions
                            if (actions != null && actions.length() > 0) {
                                processDeviceActions(actions)
                            }
                        }
                    } catch (e: Exception) {
                        Log.e("Auroza", "Failed parsing response", e)
                    }
                }
            }
        })
    }

    private fun processDeviceActions(actions: org.json.JSONArray) {
        for (i in 0 until actions.length()) {
            val action = actions.getJSONObject(i)
            val type = action.optString("type")
            val payload = action.optJSONObject("payload")

            when (type) {
                "open_app" -> {
                    val appName = payload?.optString("appName") ?: ""
                    Toast.makeText(this, "Opening app $appName via system intents...", Toast.LENGTH_SHORT).show()
                }
                "make_call" -> {
                    val phone = payload?.optString("phoneNumber") ?: ""
                    Toast.makeText(this, "Calling number $phone...", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun speakOut(text: String) {
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "AurozaTTS")
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts.language = Locale.getDefault()
            Log.d("Auroza", "TTS Engaged successfully.")
        }
    }

    override fun onDestroy() {
        if (::speechRecognizer.isInitialized) {
            speechRecognizer.destroy()
        }
        if (::tts.isInitialized) {
            tts.stop()
            tts.shutdown()
        }
        super.onDestroy()
    }
}
