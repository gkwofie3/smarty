import webview
import sys

def main():
    webview.create_window('Smarty Editor', 'http://localhost:5002')
    webview.start()

if __name__ == '__main__':
    main()
