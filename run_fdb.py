import webview
import sys

def main():
    webview.create_window('Smarty FDB', 'http://localhost:5003')
    webview.start()

if __name__ == '__main__':
    main()
