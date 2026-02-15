import webview
import sys
import os

def get_asset_path(relative_path):
    base_path = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_path, relative_path)

def main():
    icon_path = get_asset_path('fdb/public/fdb.png')
    window = webview.create_window('Smarty FDB', 'http://localhost:5003', icon=icon_path)
    
    def on_loaded():
        window.evaluate_js("""
            document.addEventListener('click', function(e) {
                var target = e.target.closest('a');
                if (target && (target.target === '_blank' || target.getAttribute('target') === '_blank')) {
                    e.preventDefault();
                    window.pywebview.api.open_new_window(target.href);
                }
            });
            window.open = function(url) {
                window.pywebview.api.open_new_window(url);
            };
        """)

    class Api:
        def open_new_window(self, url):
            webview.create_window('Smarty Window', url)

    window.expose(Api())
    webview.start(on_loaded, window)

if __name__ == '__main__':
    main()
