
package `in`.gov.indiapost.mailssorting

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Bundle
import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.graphics.Color

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var progress: ProgressBar
    private lateinit var errorText: TextView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(13, 91, 160)
        window.navigationBarColor = Color.BLACK

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.WHITE)
        }

        progress = ProgressBar(
            this, null,
            android.R.attr.progressBarStyleHorizontal
        ).apply {
            max = 100
            visibility = View.VISIBLE
        }

        errorText = TextView(this).apply {
            text = "ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ. ಮತ್ತೆ ತೆರೆಯಲು ಪರದೆಯನ್ನು ಒತ್ತಿರಿ."
            textSize = 16f
            setTextColor(Color.DKGRAY)
            setPadding(24, 24, 24, 24)
            visibility = View.GONE
            setOnClickListener { loadApp() }
        }

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.loadsImagesAutomatically = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = false

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progress.progress = newProgress
                progress.visibility =
                    if (newProgress >= 100) View.GONE else View.VISIBLE
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                progress.visibility = View.GONE
                errorText.visibility = View.GONE
                webView.visibility = View.VISIBLE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                if (request?.isForMainFrame == true) {
                    progress.visibility = View.GONE
                    errorText.visibility = View.VISIBLE
                }
            }
        }

        layout.addView(progress, LinearLayout.LayoutParams(-1, 4))
        layout.addView(errorText, LinearLayout.LayoutParams(-1, -2))
        layout.addView(webView, LinearLayout.LayoutParams(-1, 0, 1f))

        setContentView(layout)
        loadApp()
    }

    private fun loadApp() {
        errorText.visibility = View.GONE
        webView.visibility = View.VISIBLE
        progress.visibility = View.VISIBLE

        // Hubli Sorting App URL
        webView.loadUrl(
            "https://appggkaniyuru.github.io/Hubli-Sorting-App/"
        )
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        if (::webView.isInitialized) webView.destroy()
        super.onDestroy()
    }
}
