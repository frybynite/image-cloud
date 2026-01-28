/**
 * View Source Popup
 * Adds a "View Source" button that opens the page source in a popup window
 * with a copy-to-clipboard button.
 *
 * Usage: <script src="view-source-popup.js"></script>
 */
(function () {
    const btn = document.createElement('button');
    btn.textContent = 'View Source';
    Object.assign(btn.style, {
        position: 'fixed', bottom: '16px', right: '16px',
        padding: '8px 14px', background: 'rgba(255,255,255,0.15)',
        color: '#ccc', border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
        fontFamily: 'system-ui, sans-serif', zIndex: '10000',
        backdropFilter: 'blur(8px)'
    });
    btn.onmouseover = () => btn.style.background = 'rgba(255,255,255,0.25)';
    btn.onmouseout = () => btn.style.background = 'rgba(255,255,255,0.15)';
    btn.onclick = () => {
        fetch(location.href)
            .then(r => r.text())
            .then(html => {
                const w = window.open('', '_blank', 'width=720,height=600');
                w.document.write([
                    '<!DOCTYPE html><html><head><title>Page Source</title>',
                    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">',
                    '<style>',
                    'body { margin:0; background:#2d2d2d }',
                    'pre { margin:0; border-radius:0 }',
                    'pre code { white-space:pre-wrap; word-wrap:break-word; font-size:13px; line-height:1.5 }',
                    '#copyBtn { position:sticky; top:0; display:block; width:100%; padding:10px; background:#1a1a1a; color:#ccc; border:none; cursor:pointer; font-size:14px; font-family:system-ui,sans-serif; z-index:1 }',
                    '#copyBtn:hover { background:#333 }',
                    '</style></head><body>',
                    '<button id="copyBtn">Copy to Clipboard</button>',
                    '<pre><code class="language-html"></code></pre>',
                    '</body></html>'
                ].join('\n'));
                w.document.close();

                var codeEl = w.document.querySelector('code');
                codeEl.textContent = html;

                // Load Prism and highlight
                var script = w.document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
                script.onload = () => w.Prism.highlightElement(codeEl);
                w.document.head.appendChild(script);

                w.document.getElementById('copyBtn').onclick = function () {
                    navigator.clipboard.writeText(codeEl.textContent)
                        .then(() => {
                            this.textContent = 'Copied!';
                            setTimeout(() => this.textContent = 'Copy to Clipboard', 1500);
                        });
                };
            });
    };
    document.body.appendChild(btn);
})();
