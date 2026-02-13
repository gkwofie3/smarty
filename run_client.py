import webview
import sys

def main():
    webview.create_window('Smarty Client', 'http://localhost:5004')
    webview.start()

if __name__ == '__main__':
    main()
