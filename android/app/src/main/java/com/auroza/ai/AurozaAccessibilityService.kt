package com.auroza.ai

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Intent
import android.graphics.Path
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Auroza AI - Premium Android Accessibility Service.
 * Allows the AI to automate taps, type messages, search platforms (daraz, amazon, youtube),
 * and execute complex physical workflows when granted user permission.
 */
class AurozaAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AurozaService"
        var instance: AurozaAccessibilityService? = null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Auroza Accessibility Service connected.")
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Track screen changes to update memory and automation routing context
        if (event?.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            val packageName = event.packageName?.toString() ?: ""
            Log.d(TAG, "Focused Application package changed to: $packageName")
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Auroza Accessibility Service Interrupted.")
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Simulates a physical tap at coordinates (x, y) on the screen.
     */
    fun performTapAt(x: Float, y: Float, callback: (() -> Unit)? = null) {
        val path = Path().apply {
            moveTo(x, y)
        }
        val builder = GestureDescription.Builder()
        builder.addStroke(GestureDescription.StrokeDescription(path, 0, 100))
        
        dispatchGesture(builder.build(), object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d(TAG, "Tap completed successfully at coordinate ($x, $y)")
                callback?.invoke()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Tap gesture cancelled at coordinate ($x, $y)")
            }
        }, null)
    }

    /**
     * Finds a text input box by view ID or hint text, clicks it, and enters user content.
     */
    fun typeTextIntoView(viewId: String, textToType: String): Boolean {
        val rootNode = rootInActiveWindow ?: return false
        val nodes = rootNode.findAccessibilityNodeInfosByViewId(viewId)
        if (nodes.isNotEmpty()) {
            val node = nodes[0]
            if (node.isFocusable) {
                node.performAction(AccessibilityNodeInfo.ACTION_FOCUS)
                val arguments = android.os.Bundle()
                arguments.putCharSequence(
                    AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                    textToType
                )
                node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
                Log.d(TAG, "Injected text successfully via Accessibility node: $viewId")
                return true
            }
        }
        return false
    }

    /**
     * Performs a global home gesture to minimize the current application.
     */
    fun pressHomeButton() {
        performGlobalAction(GLOBAL_ACTION_HOME)
    }

    /**
     * Triggers the Android back button.
     */
    fun pressBackButton() {
        performGlobalAction(GLOBAL_ACTION_BACK)
    }
}
