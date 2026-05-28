package com.masim05.bloodpressure.mobile

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.rgb(248, 250, 252))
            setPadding(32.dp, 32.dp, 32.dp, 32.dp)
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )
        }

        val title = TextView(this).apply {
            text = "Blood Pressure Tracker"
            setTextColor(Color.rgb(15, 23, 42))
            textSize = 28f
            gravity = Gravity.CENTER
        }

        val message = TextView(this).apply {
            text = "Hello world"
            setTextColor(Color.rgb(71, 85, 105))
            textSize = 20f
            gravity = Gravity.CENTER
            setPadding(0, 16.dp, 0, 0)
        }

        root.addView(title)
        root.addView(message)
        setContentView(root)
    }

    private val Int.dp: Int
        get() = (this * resources.displayMetrics.density).toInt()
}
